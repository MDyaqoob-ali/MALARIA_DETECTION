import requests

url = 'http://127.0.0.1:5000/result'

# Test infected image
files = {'pic': open('samples/infected.png', 'rb')}
response = requests.post(url, files=files)
print(f'Infected image response code: {response.status_code}')
if "Infected with Malarial Parasite" in response.text:
    print("Infected prediction correct.")
else:
    print("Infected prediction failed or unexpected text.")

# Test uninfected image
files = {'pic': open('samples/uninfected.png', 'rb')}
response = requests.post(url, files=files)
print(f'Uninfected image response code: {response.status_code}')
if "Not Infected with Malarial Parasite" in response.text:
    print("Uninfected prediction correct.")
else:
    print("Uninfected prediction failed or unexpected text.")
