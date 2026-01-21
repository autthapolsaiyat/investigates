"""
Login Tracking Utilities
Parse user agent and get IP geolocation
"""
import re
import httpx
from typing import Optional, Dict, Any


def parse_user_agent(user_agent: str) -> Dict[str, str]:
    """
    Parse user agent string to extract device type, browser, and OS
    """
    if not user_agent:
        return {"device_type": "unknown", "browser": "unknown", "os": "unknown"}
    
    ua_lower = user_agent.lower()
    
    # Detect device type
    device_type = "desktop"
    if any(x in ua_lower for x in ["mobile", "android", "iphone", "ipod"]):
        device_type = "mobile"
    elif any(x in ua_lower for x in ["ipad", "tablet"]):
        device_type = "tablet"
    
    # Detect browser
    browser = "unknown"
    if "edg" in ua_lower:
        browser = "Edge"
    elif "chrome" in ua_lower and "safari" in ua_lower:
        browser = "Chrome"
    elif "firefox" in ua_lower:
        browser = "Firefox"
    elif "safari" in ua_lower:
        browser = "Safari"
    elif "opera" in ua_lower or "opr" in ua_lower:
        browser = "Opera"
    elif "msie" in ua_lower or "trident" in ua_lower:
        browser = "Internet Explorer"
    
    # Detect OS
    os = "unknown"
    if "windows nt 10" in ua_lower:
        os = "Windows 10/11"
    elif "windows nt 6.3" in ua_lower:
        os = "Windows 8.1"
    elif "windows nt 6.2" in ua_lower:
        os = "Windows 8"
    elif "windows nt 6.1" in ua_lower:
        os = "Windows 7"
    elif "windows" in ua_lower:
        os = "Windows"
    elif "mac os x" in ua_lower:
        os = "macOS"
    elif "iphone" in ua_lower:
        os = "iOS"
    elif "ipad" in ua_lower:
        os = "iPadOS"
    elif "android" in ua_lower:
        os = "Android"
    elif "linux" in ua_lower:
        os = "Linux"
    
    return {
        "device_type": device_type,
        "browser": browser,
        "os": os
    }


async def get_ip_geolocation(ip_address: str) -> Dict[str, Any]:
    """
    Get geolocation info from IP address using ip-api.com (free service)
    Rate limit: 45 requests per minute
    """
    # Skip private/local IPs
    if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1"]:
        return {
            "country": "Local",
            "country_code": "LO",
            "region": None,
            "city": "Localhost",
            "latitude": None,
            "longitude": None,
            "isp": "Local Network"
        }
    
    # Check if private IP
    if ip_address.startswith(("10.", "172.16.", "172.17.", "172.18.", "172.19.",
                               "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
                               "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
                               "172.30.", "172.31.", "192.168.")):
        return {
            "country": "Private Network",
            "country_code": "PN",
            "region": None,
            "city": "Private",
            "latitude": None,
            "longitude": None,
            "isp": "Private Network"
        }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # ip-api.com - free, no API key needed
            response = await client.get(
                f"http://ip-api.com/json/{ip_address}",
                params={
                    "fields": "status,message,country,countryCode,region,regionName,city,lat,lon,isp"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "success":
                    return {
                        "country": data.get("country"),
                        "country_code": data.get("countryCode"),
                        "region": data.get("regionName"),
                        "city": data.get("city"),
                        "latitude": data.get("lat"),
                        "longitude": data.get("lon"),
                        "isp": data.get("isp")
                    }
    except Exception as e:
        print(f"Error getting IP geolocation: {e}")
    
    return {
        "country": None,
        "country_code": None,
        "region": None,
        "city": None,
        "latitude": None,
        "longitude": None,
        "isp": None
    }


def get_client_ip(request) -> str:
    """
    Get real client IP from request, considering proxies
    """
    ip = None
    
    # Check X-Forwarded-For header (common for proxies/load balancers)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP (original client)
        ip = forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header (nginx)
    if not ip:
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            ip = real_ip.strip()
    
    # Fall back to direct client IP
    if not ip and request.client:
        ip = request.client.host
    
    if not ip:
        return "unknown"
    
    # Strip port if present (e.g., "192.168.1.1:8080" -> "192.168.1.1")
    if ":" in ip and not ip.startswith("["):  # Don't break IPv6
        ip = ip.split(":")[0]
    
    return ip
