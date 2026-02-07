import asyncio
import httpx
from selectolax.parser import HTMLParser

URL = "https://amzn.to/4a4jTQV"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
}

async def main():
    print(f"Fetching {URL}...")
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True) as client:
        resp = await client.get(URL)
        print(f"Status: {resp.status_code}")
        print(f"Final URL: {resp.url}")
        
        html = HTMLParser(resp.text)
        
        # Check Title
        title_node = html.css_first("#productTitle")
        title = title_node.text(strip=True) if title_node else "NOT FOUND"
        print(f"Title (#productTitle): {title}")
        
        if title == "NOT FOUND":
            h1 = html.css_first("h1")
            print(f"Title (h1): {h1.text(strip=True) if h1 else 'NOT FOUND'}")

        # Check for captcha
        if "captcha" in resp.text.lower():
            print("CAPTCHA DETECTED!")
            
        # Dump HTML snippet
        print("\nHTML Snippet:")
        print(resp.text[:500])

if __name__ == "__main__":
    asyncio.run(main())
