from tools.flights import flight_search   # since you're running from inside backend/

result = flight_search(
    origin="DEL",
    destination="BOM",
    departure_date="2026-06-20",
    adults=1,
)
print(result)