import urllib.request
import json

urls = [
    "https://api.stock.naver.com/chart/domestic/index/KOSPI?periodType=dayCandle",
    "https://m.stock.naver.com/api/chart/domestic/index/KOSPI?periodType=dayCandle",
    "https://polling.finance.naver.com/api/realtime/domestic/index/KOSPI",
    "https://m.stock.naver.com/front-api/chart/index?symbol=KOSPI&periodType=day",
    "https://m.stock.naver.com/api/index/KOSPI/basic"
]

headers = {"User-Agent": "Mozilla/5.0"}
for u in urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"URL: {u}")
            if isinstance(data, list):
                print(f"  Length: {len(data)}, Item[0]: {data[0] if data else None}")
            elif isinstance(data, dict):
                print("  Keys:", list(data.keys()))
                if "datas" in data:
                    print("  datas sample:", data["datas"][0] if data["datas"] else None)
                if "priceInfos" in data:
                    print("  priceInfos length:", len(data["priceInfos"]))
    except Exception as e:
        print(f"URL: {u} -> {e}")
