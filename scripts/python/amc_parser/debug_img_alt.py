import requests
from bs4 import BeautifulSoup

url = 'https://artofproblemsolving.com/wiki/index.php/2007_AMC_10A_Problems/Problem_17'
html = requests.get(url).text
soup = BeautifulSoup(html, 'html.parser')

for img in soup.find_all('img'):
    print('ALT:', img.get('alt', '')) 