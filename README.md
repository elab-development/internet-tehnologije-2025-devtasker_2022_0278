## Opis aplikacije

**Dev Tasker** je web aplikacija za organizaciju rada malih i srednjih razvojnih timova, nastala kao odgovor na čestu praksu vođenja zadataka kroz Excel tabele, chat poruke i improvizovane liste. Takav pristup lako dovodi do preklapanja posla, zaboravljenih obaveza i slabe vidljivosti prioriteta. Dev Tasker centralizuje projekte, zadatke i komunikaciju na jednom mestu, čime olakšava svakodnevni rad tima i obezbeđuje transparentan pregled napretka.

![Devtasker Slika](./devfe/public/slika1.png)

Glavni cilj aplikacije je jednostavno upravljanje zadacima po projektima uz praćenje statusa i prioriteta, bez nepotrebne kompleksnosti i prevelikog broja konfiguracija. Fokus je na jasnom toku rada: definisanje zadatka, dodela odgovorne osobe, praćenje napretka i kratka razmena informacija kroz komentare. Product Owner-u aplikacija pruža osnovni uvid u ključne metrike i opterećenje tima, dok administrator može da postavi osnovne kategorije (tagove) i pravila koja važe za ceo sistem.

Sistem koriste tri glavne uloge:
- **Developer**: vidi šta radi “danas”, rokove, status, prioritet i napomene u komentarima; brzo ažurira status i ostavlja komentare.
- **Product Owner**: organizuje backlog, kreira i prioritetizuje zadatke po projektima i prati stanje realizacije kroz osnovne metrike.
- **Task admin**: inicijalno podešava sistem, definiše tagove i obezbeđuje doslednu primenu pravila korišćenja.

Na visokom nivou, aplikacija omogućava:
- registraciju i prijavu korisnika, dodelu globalnih uloga i dovođenje korisnika na projekte,
- kreiranje i uređivanje projekata,
- kreiranje, dodelu i praćenje zadataka kroz životni ciklus (status, prioritet, rok, odgovorna osoba),
- komentarisanje zadataka kao brzu internu komunikaciju,
- dodatne integracije (npr. preporuke YouTube tutorijala i developerske šale) radi boljeg korisničkog iskustva.

## Tehnologije korišćene

- **Frontend**
  - **React** (SPA, komponentni UI)
  - **JavaScript** (logika u pregledaču, asinhroni pozivi ka API-ju)
  - **Node.js 18+** i **npm** (upravljanje zavisnostima i pokretanje aplikacije)

- **Backend**
  - **PHP 8.2+**
  - **Laravel** (MVC arhitektura, rutiranje, validacija, izgradnja REST API-ja)
  - **Eloquent ORM** (rad sa modelima i relacijama), **migracije** i **seed** podaci (verzionisanje i inicijalizacija baze)
  - **Composer** (PHP dependency management)

- **Baza podataka**
  - **MySQL** (relaciona baza; integritet podataka kroz ključeve/relacije, indeksi; pristup preko Eloquent ORM-a)

- **Integracije**
  - **YouTube Data API** (preporučeni edukativni sadržaj na osnovu tagova)
  - **Programming Jokes API** (prikaz developerskih šala)
  - Integracije se pozivaju preko backend-a, koji obrađuje JSON odgovore i prosleđuje frontend-u samo potrebne podatke.

- **DevOps / alati**
  - **Git** (verzionisanje) i **GitHub** (repo, kolaboracija, pull request-ovi, issues)
  - **Docker / Docker Compose** (opciono pokretanje projekta u kontejnerima)
  - **XAMPP (Apache)** (lokalno okruženje za pokretanje servisa prema uputstvu)


## Pokretanje projekta (lokalno bez Docker-a)

> Pretpostavke: instalirani **Node 18+**, **PHP 8.2+**, **Composer**, **XAMPP**.
> NAPOMENA: U XAMPP-u pokrenuti: **Apache** i **MySQL**

1. Klonirajte repozitorijum:
```bash
    git clone https://github.com/elab-development/internet-tehnologije-2025-devtasker_2022_0278.git
```
2. Pokrenite backend:
```bash
   cd devbe
   composer install
   php artisan migrate:fresh --seed
   php artisan serve
```
    
3. Pokrenite frontend:
```bash
   cd devfe
   npm install
   npm start
```
    
4.  Frontend pokrenut na: [http://localhost:3000](http://localhost:3000) Backend API pokrenut na: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

## Pokretanje projekta uz Docker

> Pretpostavke: instaliran i pokrenut **Docker Desktop**.
> NAPOMENA: U XAMPP-u pokrenuti: **Apache** (**MySQL** sada pokrece Docker, tako da njega ne pokretati!)

1. Klonirajte repozitorijum:
```bash
    git clone https://github.com/elab-development/internet-tehnologije-2025-devtasker_2022_0278.git
```

2. Pokrenite Docker kompoziciju:
```bash
    docker compose down -v
    docker compose up --build
```

3.  Frontend pokrenut na: [http://localhost:3000](http://localhost:3000) Backend API pokrenut na: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)