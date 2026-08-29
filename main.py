from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
import requests
from pymongo import MongoClient
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace with your free MongoDB Atlas connection string
MONGO_URI = os.getenv("MONGO_URI")

if MONGO_URI:
    print(f"MONGO_URI loaded from environment: {MONGO_URI[:10]}...{MONGO_URI[-10:]}")
else:
    print("MONGO_URI NOT loaded. Ensure your .env file has MONGO_URI=...")
client = MongoClient(MONGO_URI)
db = client["sih_database"]
collection = db["problem_statements"]
def scrape_sih():
    url = "https://sih.gov.in/sih2026PS"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    
    table = soup.find("table", id="dataTablePS")
    if not table: return
    
    tbody = table.find("tbody")
    if not tbody: return
    
    # recursive=False prevents scraping rows from the modal's internal table
    for row in tbody.find_all("tr", recursive=False):
        # recursive=False prevents mixing modal <td> tags with main table <td> tags
        cols = row.find_all("td", recursive=False)
        
        if len(cols) < 8: 
            continue
        
        title_tag = cols[2].find("a")
        title = title_tag.text.strip() if title_tag else ""
        ps_number = cols[4].text.strip()
        
        modal = cols[2].find("div", class_="modal")
        description = ""
        if modal:
            desc_th = modal.find("th", string="Description")
            if desc_th:
                desc_td = desc_th.find_next_sibling("td")
                description = desc_td.text.strip() if desc_td else ""
        
        ps_data = {
            "organization": cols[1].text.strip(),
            "title": title,
            "description": description,
            "category": cols[3].text.strip(),
            "ps_number": ps_number,
            "submissions": cols[5].text.strip(),
            "theme": cols[6].text.strip(),
            "deadline": cols[7].text.strip()
        }
        
        collection.update_one({"ps_number": ps_number}, {"$set": ps_data}, upsert=True)
@app.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(scrape_sih)
    return {"message": "Scraping job started in the background."}

@app.get("/problems")
def get_problems():
    return list(collection.find({}, {"_id": 0}))