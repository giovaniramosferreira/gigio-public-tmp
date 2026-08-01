import asyncio
from curl_cffi.requests import AsyncSession
from selectolax.parser import HTMLParser

URL = "https://amzn.to/4a4jTQV"

async def main():
    print(f"Fetching {URL} with curl_cffi...")
    async with AsyncSession(impersonate="chrome120") as s:
        resp = await s.get(URL, allow_redirects=True)
        print(f"Status: {resp.status_code}")
        print(f"Final URL: {resp.url}")
        
        html = HTMLParser(resp.text)
        title_node = html.css_first("#productTitle")
        title = title_node.text(strip=True) if title_node else "NOT FOUND"
        print(f"Title: {title}")
        
        if "captcha" in resp.text.lower():
            print("CAPTCHA DETECTED!")
        else:
             print("No CAPTCHA detected.")

if __name__ == "__main__":
    asyncio.run(main())
