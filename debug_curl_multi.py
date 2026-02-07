import asyncio
from curl_cffi.requests import AsyncSession
from selectolax.parser import HTMLParser

URL = "https://amzn.to/4a4jTQV"

async def test_impersonation(imp_name, mobile=False):
    print(f"\n--- Testing {imp_name} {'(Mobile)' if mobile else ''} ---")
    
    headers = None
    if mobile:
         headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
         }

    try:
        async with AsyncSession(impersonate=imp_name, headers=headers) as s:
            resp = await s.get(URL, allow_redirects=True)
            
            if "captcha" in resp.text.lower():
                print("❌ CAPTCHA")
            else:
                html = HTMLParser(resp.text)
                title = html.css_first("#productTitle") or html.css_first("#title") or html.css_first("h1")
                if title:
                    print(f"✅ SUCCESS: {title.text(strip=True)[:50]}...")
                else:
                    print("⚠️ No Captcha but No Title found")
                    print(resp.text[:200])
                    
    except Exception as e:
        print(f"Error: {e}")

async def main():
    await test_impersonation("chrome120")
    await test_impersonation("safari15_5")
    await test_impersonation("safari15_5", mobile=True)

if __name__ == "__main__":
    asyncio.run(main())
