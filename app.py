# app.py
from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np # <--- 確保導入 numpy
import os
import traceback # <--- 用於打印詳細錯誤

app = Flask(__name__)

# --- Configuration ---
DATA_DIR = os.path.join('static', 'assets', 'data')
PRICE_CSV = os.path.join(DATA_DIR, 'googl_daily_prices.csv')
INCOME_CSV = os.path.join(DATA_DIR, 'googl_income_statement.csv')
BALANCE_CSV = os.path.join(DATA_DIR, 'googl_balance_sheet.csv')
CASHFLOW_CSV = os.path.join(DATA_DIR, 'googl_cash_flow_statement.csv')

# --- Helper Function for Type Conversion ---
def convert_numpy_types(data):
    if isinstance(data, dict):
        return {k: convert_numpy_types(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_numpy_types(i) for i in data]
    elif isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, np.bool_):
        return bool(data)
    elif pd.isna(data): # Handle Pandas NA before it might cause issues
         return None # Or return 'N/A' if that's better for frontend
    return data

# --- Data Loading and Preprocessing ---
def load_and_prepare_data():
    try:
        prices_df = pd.read_csv(PRICE_CSV)
        income_df = pd.read_csv(INCOME_CSV)
        balance_df = pd.read_csv(BALANCE_CSV)
        cashflow_df = pd.read_csv(CASHFLOW_CSV)

        price_column_map = {
            '1. open': 'open', '2. high': 'high', 
            '3. low': 'low', '4. close': 'close', 
            '5. volume': 'volume'
        }
        prices_df.rename(columns=price_column_map, inplace=True)

        for col in prices_df.columns:
            if prices_df[col].dtype == 'object':
                prices_df[col] = prices_df[col].replace('None', pd.NA)
        prices_df['date'] = pd.to_datetime(prices_df['date'], errors='coerce')
        prices_df.dropna(subset=['date'], inplace=True) 

        numeric_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_cols:
            prices_df[col] = pd.to_numeric(prices_df[col], errors='coerce')

        prices_df = prices_df.sort_values(by='date').reset_index(drop=True)
        
        splits = [
            {'date': '2014-03-27', 'ratio_factor': 2002 / 1000},
            {'date': '2015-04-27', 'ratio_factor': 10027455 / 10000000},
            {'date': '2022-07-18', 'ratio_factor': 20 / 1}
        ]
        
        for split in splits:
            split_date = pd.to_datetime(split['date'])
            ratio = split['ratio_factor']
            prices_df.loc[prices_df['date'] < split_date, ['open', 'high', 'low', 'close']] /= ratio
            prices_df.loc[prices_df['date'] < split_date, 'volume'] *= ratio
            
        prices_df = prices_df.dropna(subset=numeric_cols)

        def process_financial_df(df, df_name="Financial Statement"):
            df = df.replace({'None': pd.NA, 'NONE': pd.NA, '': pd.NA, '-': pd.NA})
            date_col = 'fiscalDateEnding'
            if date_col not in df.columns:
                print(f"Warning: Column '{date_col}' not found in {df_name}.")
                return pd.DataFrame() 

            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            df = df.dropna(subset=[date_col]) 

            for col in df.columns:
                if col not in [date_col, 'reportedCurrency']:
                    try:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    except Exception as e:
                        print(f"Warning: Could not convert column {col} in {df_name} to numeric: {e}")
                        df[col] = pd.NA 
            df = df.sort_values(by=date_col).reset_index(drop=True)
            return df

        income_df = process_financial_df(income_df, "Income Statement")
        balance_df = process_financial_df(balance_df, "Balance Sheet")
        cashflow_df = process_financial_df(cashflow_df, "Cash Flow Statement")
        
        print(f"Debug: Loaded Prices DF length: {len(prices_df)}")
        print(f"Debug: Loaded Income DF length: {len(income_df)}")
        print(f"Debug: Loaded Balance DF length: {len(balance_df)}")
        
        return prices_df, income_df, balance_df, cashflow_df
    except Exception as e:
        print(f"Error in load_and_prepare_data: {e}")
        traceback.print_exc()
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

PRICES_DF, INCOME_DF, BALANCE_DF, CASHFLOW_DF = load_and_prepare_data()

def calculate_financial_ratios_historical():
    if INCOME_DF.empty or BALANCE_DF.empty or PRICES_DF.empty:
        print("Debug calc_ratios: Initial DFs empty - INCOME_DF.empty:", INCOME_DF.empty, "BALANCE_DF.empty:", BALANCE_DF.empty, "PRICES_DF.empty:", PRICES_DF.empty)
        return pd.DataFrame()
    
    ratios_list = []
    try:
        temp_income_df = INCOME_DF.copy()
        temp_balance_df = BALANCE_DF.copy()
        temp_prices_df = PRICES_DF.copy()

        temp_income_df['fiscalDateEnding'] = pd.to_datetime(temp_income_df['fiscalDateEnding'], errors='coerce')
        temp_balance_df['fiscalDateEnding'] = pd.to_datetime(temp_balance_df['fiscalDateEnding'], errors='coerce')
        temp_prices_df['date'] = pd.to_datetime(temp_prices_df['date'], errors='coerce')
        
        temp_income_df.dropna(subset=['fiscalDateEnding'], inplace=True)
        temp_balance_df.dropna(subset=['fiscalDateEnding'], inplace=True)
        temp_prices_df.dropna(subset=['date'], inplace=True)

        if temp_income_df.empty or temp_balance_df.empty or temp_prices_df.empty:
            print("Debug calc_ratios: DFs became empty after NaT drop for dates.")
            return pd.DataFrame()

        all_financials = pd.merge(
            temp_income_df, temp_balance_df, 
            on=['fiscalDateEnding', 'reportedCurrency'], how='inner', suffixes=('_inc', '_bal') 
        )
        print(f"Debug calc_ratios: After merging Income and Balance, all_financials length: {len(all_financials)}")
        if all_financials.empty:
            print("Debug calc_ratios: Merging Income and Balance sheets resulted in an empty DataFrame.")
            return pd.DataFrame()

        temp_prices_df = temp_prices_df.rename(columns={'date': 'price_date', 'close': 'stock_price'})
        all_financials = all_financials.sort_values('fiscalDateEnding')
        temp_prices_df = temp_prices_df.sort_values('price_date')
        
        all_financials_with_prices = pd.merge_asof(
            all_financials, temp_prices_df,
            left_on='fiscalDateEnding', right_on='price_date', direction='nearest'
        )
        print(f"Debug calc_ratios: After merging with Prices, all_financials_with_prices length: {len(all_financials_with_prices)}")

        if all_financials_with_prices.empty:
            print("Debug calc_ratios: Merging with stock prices resulted in an empty DataFrame.")
            return pd.DataFrame()
        
        for _, row in all_financials_with_prices.iterrows():
            NI = row.get('netIncome')
            TA = row.get('totalAssets')
            SE = row.get('totalShareholderEquity')
            SO = row.get('commonStockSharesOutstanding') 
            TR = row.get('totalRevenue')
            TCA = row.get('totalCurrentAssets')
            TCL = row.get('totalCurrentLiabilities')
            Inv = row.get('inventory', 0) if pd.notna(row.get('inventory')) else 0 
            Cash = row.get('cashAndCashEquivalentsAtCarryingValue')
            CR = row.get('costOfRevenue') 
            TL = row.get('totalLiabilities')
            Price = row.get('stock_price') 

            eps_val = (NI / SO) if pd.notna(NI) and pd.notna(SO) and SO != 0 else None
            current_val = (TCA / TCL) if pd.notna(TCA) and pd.notna(TCL) and TCL != 0 else None
            quick_val = ((TCA - Inv) / TCL) if pd.notna(TCA) and pd.notna(Inv) and pd.notna(TCL) and TCL != 0 else None
            nwc_turn_denominator = (TCA - TCL) if pd.notna(TCA) and pd.notna(TCL) else None
            nwc_turn_val = (TR / nwc_turn_denominator) if pd.notna(TR) and pd.notna(nwc_turn_denominator) and nwc_turn_denominator != 0 else None

            ratios = {
                'fiscalDateEnding': row['fiscalDateEnding'],
                'eps': eps_val,
                'roa': (NI / TA) if pd.notna(NI) and pd.notna(TA) and TA != 0 else None,
                'roe': (NI / SE) if pd.notna(NI) and pd.notna(SE) and SE != 0 else None,
                'pe': (Price / eps_val) if pd.notna(Price) and pd.notna(eps_val) and eps_val != 0 else None,
                'ps': (Price * SO / TR) if pd.notna(Price) and pd.notna(SO) and pd.notna(TR) and TR != 0 else None,
                'pm': (NI / TR) if pd.notna(NI) and pd.notna(TR) and TR != 0 else None,
                'current': current_val,
                'quick': quick_val,
                'cash': (Cash / TCL) if pd.notna(Cash) and pd.notna(TCL) and TCL != 0 else None,
                'invTurn': (CR / Inv) if pd.notna(CR) and pd.notna(Inv) and Inv != 0 else None, 
                'nwcTurn': nwc_turn_val,
                'assetTurn': (TR / TA) if pd.notna(TR) and pd.notna(TA) and TA != 0 else None,
                'debt': (TL / TA) if pd.notna(TL) and pd.notna(TA) and TA != 0 else None,
                'de': (TL / SE) if pd.notna(TL) and pd.notna(SE) and SE != 0 else None,
                'em': (TA / SE) if pd.notna(TA) and pd.notna(SE) and SE != 0 else None,
            }
            ratios_list.append(ratios)

        if not ratios_list:
            print("Debug calc_ratios: ratios_list is empty after processing all rows.")
            return pd.DataFrame()
            
        return pd.DataFrame(ratios_list)
    except Exception as e:
        print(f"Error in calculate_financial_ratios_historical: {e}")
        traceback.print_exc()
        return pd.DataFrame()


HISTORICAL_RATIOS_DF = calculate_financial_ratios_historical()
if HISTORICAL_RATIOS_DF.empty:
    print("Warning: HISTORICAL_RATIOS_DF is empty after calculation. Latest ratios will be empty.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stock_data')
def get_stock_data():
    time_range = request.args.get('time_range', '1y')
    if PRICES_DF.empty: return jsonify([])
    end_date = PRICES_DF['date'].max()
    if time_range == '1y': start_date = end_date - pd.DateOffset(years=1)
    elif time_range == '3y': start_date = end_date - pd.DateOffset(years=3)
    elif time_range == '5y': start_date = end_date - pd.DateOffset(years=5)
    else: start_date = PRICES_DF['date'].min()
    filtered_df = PRICES_DF[(PRICES_DF['date'] >= start_date) & (PRICES_DF['date'] <= end_date)]
    return jsonify(convert_numpy_types(filtered_df.to_dict(orient='records'))) # Added conversion

@app.route('/api/financial_statement')
def get_financial_statement():
    statement_type = request.args.get('type', 'income')
    df = pd.DataFrame()
    if statement_type == 'income': df = INCOME_DF
    elif statement_type == 'balance': df = BALANCE_DF
    elif statement_type == 'cashflow': df = CASHFLOW_DF
    if df.empty: return jsonify([])
    df_copy = df.copy()
    if 'fiscalDateEnding' in df_copy.columns:
         df_copy['fiscalDateEnding'] = df_copy['fiscalDateEnding'].dt.strftime('%Y-%m-%d')
    return jsonify(convert_numpy_types(df_copy.fillna('N/A').to_dict(orient='records'))) # Added conversion

@app.route('/api/income_statement_components')
def get_income_statement_components():
    try:
        if INCOME_DF.empty:
            print("Warning: INCOME_DF is empty in /api/income_statement_components")
            return jsonify({'pie_data': {'labels':[], 'values':[], 'error': 'Income data not available'}})
        
        latest_income = INCOME_DF.iloc[-1].fillna(0) 

        revenue_calc = latest_income.get('totalRevenue', 0)
        cogs_calc = latest_income.get('costOfRevenue', 0)
        gross_profit_calc = latest_income.get('grossProfit', 0)
        if gross_profit_calc == 0 and revenue_calc != 0 : 
             gross_profit_calc = revenue_calc - cogs_calc
        
        op_ex_calc = latest_income.get('operatingExpenses', 0)
        income_before_tax_calc = latest_income.get('incomeBeforeTax', 0)
        if income_before_tax_calc == 0 and gross_profit_calc !=0 : 
            income_before_tax_calc = gross_profit_calc - op_ex_calc
            
        income_tax_expense_calc = latest_income.get('incomeTaxExpense', 0)
        net_income_val_calc = latest_income.get('netIncome', 0)
        
        taxes_other_val = income_before_tax_calc - net_income_val_calc - income_tax_expense_calc

        pie_data = {
            'labels': ['Cost of Revenue', 'Operating Expenses', 'Taxes & Other', 'Net Income'],
            'values': [ abs(cogs_calc), abs(op_ex_calc), abs(taxes_other_val), abs(net_income_val_calc) ]
        }
        
        response_data = {'pie_data': pie_data} # Removed histogram_data
        return jsonify(convert_numpy_types(response_data))
    except Exception as e:
        print(f"!!! Unhandled Error in /api/income_statement_components: {e}") 
        traceback.print_exc()
        return jsonify({'pie_data': {'labels':[], 'values':[], 'error': f'Server error: {str(e)}'}})

@app.route('/api/sankey_data')
def get_sankey_data():
    try:
        if INCOME_DF.empty:
            print("Warning: INCOME_DF is empty in /api/sankey_data")
            return jsonify({
                "nodes": {"label": [], "color": [], 'error': 'Income data not available'},
                "links": {"source": [], "target": [], "value": [], "color": []}
            })
        
        latest_income = INCOME_DF.iloc[-1].fillna(0) 
        revenue_val = latest_income.get('totalRevenue', 0) 
        cogs_val = latest_income.get('costOfRevenue', 0)
        gp_val = latest_income.get('grossProfit', 0) 
        if gp_val == 0 and revenue_val != 0: 
             gp_val = revenue_val - cogs_val

        opex_val = latest_income.get('operatingExpenses', 0)
        operating_income_val = latest_income.get('operatingIncome') 
        if opex_val == 0 and pd.notna(operating_income_val) and operating_income_val != 0 and gp_val != 0:
            opex_val = gp_val - operating_income_val

        ni_val = latest_income.get('netIncome', 0)

        nodes = {"label": ["Revenue", "COGS", "Gross Profit", "Operating Expenses", "Net Income"], 
                 "color": ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]}
        links = { 
            "source": [0, 0, 2, 2], 
            "target": [1, 2, 3, 4],
            "value":  [max(0, cogs_val), max(0, gp_val), max(0, opex_val), max(0, ni_val)],
            "color": ["rgba(255,127,14,0.5)", "rgba(44,160,44,0.5)", "rgba(214,39,40,0.5)", "rgba(148,103,189,0.5)"]
        }
        response_data = {"nodes": nodes, "links": links}
        return jsonify(convert_numpy_types(response_data))
    except Exception as e:
        print(f"!!! Unhandled Error in /api/sankey_data: {e}")
        traceback.print_exc()
        return jsonify({
            "nodes": {"label": [], "color": [], 'error': f'Server error: {str(e)}'},
            "links": {"source": [], "target": [], "value": [], 'error': f'Server error: {str(e)}'} 
        })

@app.route('/api/historical_ratios')
def get_historical_ratios():
    if HISTORICAL_RATIOS_DF.empty:
        return jsonify([]) 
    df_copy = HISTORICAL_RATIOS_DF.copy()
    if 'fiscalDateEnding' in df_copy.columns:
      df_copy['fiscalDateEnding'] = pd.to_datetime(df_copy['fiscalDateEnding']).dt.strftime('%Y-%m-%d')
    return jsonify(convert_numpy_types(df_copy.fillna('N/A').to_dict(orient='records'))) # Added conversion

@app.route('/api/latest_ratios')
def get_latest_ratios():
    if HISTORICAL_RATIOS_DF.empty: return jsonify({}) 
    latest_ratios_series = HISTORICAL_RATIOS_DF.iloc[-1]
    latest_ratios_dict = {}
    for k, v in latest_ratios_series.items():
        if isinstance(v, pd.Timestamp): latest_ratios_dict[k] = v.strftime('%Y-%m-%d')
        elif pd.isna(v): latest_ratios_dict[k] = 'N/A'
        else: latest_ratios_dict[k] = v 
    return jsonify(convert_numpy_types(latest_ratios_dict)) # Added conversion

if __name__ == '__main__':
    app.run(debug=True)