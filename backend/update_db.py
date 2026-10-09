import sqlite3

c = sqlite3.connect('airbnb.db')
c.execute("UPDATE listings SET title='Flat in Candolim', city='Candolim', category='amazing-pools', price_per_night=10439, rating=5.0 WHERE id=1")
c.execute("UPDATE listings SET title='Flat in North Goa', city='North Goa', category='beachfront', price_per_night=11499, rating=5.0 WHERE id=2")
c.execute("UPDATE listings SET title='Flat in Calangute', city='Calangute', category='cabins', price_per_night=8000, rating=5.0 WHERE id=3")
c.execute("UPDATE listings SET title='Flat in Mapusa', city='Mapusa', category='castles', price_per_night=15300, rating=5.0 WHERE id=4")
c.execute("UPDATE listings SET title='Home in Assagao', city='Assagao', category='lakefront', price_per_night=17186, rating=4.89 WHERE id=5")
c.execute("UPDATE listings SET title='Apartment in Vagator', city='Vagator', category='countryside', price_per_night=17000, rating=4.91 WHERE id=6")
c.execute("UPDATE listings SET title='Apartment in Candolim', city='Candolim', category='trending', price_per_night=12967, rating=5.0 WHERE id=7")
c.commit()
c.close()
