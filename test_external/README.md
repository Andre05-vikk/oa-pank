# OA-Pank API Testid

See kaust sisaldab OA-Pank API testimise skripte, mis on loodud Mocha ja Supertest raamistike abil.

## Eeldused

- Node.js (versioon 14 või uuem)
- npm (Node.js paketihaldur)

## Paigaldamine

Vajalike sõltuvuste installimiseks käivitage järgmine käsk:

```bash
npm install
```

## Testide käivitamine

Testide käivitamiseks kasutage järgmist käsku:

```bash
npm test
```

## Testide kirjeldus

Testid kontrollivad OA-Pank API järgmisi funktsioone:

1. **Autentimine**
   - Kasutaja registreerimine
   - Sisselogimine
   - Väljalogimine
   - Seansi värskendamine

2. **Kontod**
   - Konto loomine
   - Kõikide kontode pärimine
   - Konto pärimine ID järgi

3. **Tehingud**
   - Sisemise tehingu loomine
   - Tehingute pärimine

4. **Pankadevahelised ülekanded**
   - Raha vastuvõtmine teisest pangast
   - Raha saatmine teise panka

5. **JWKS**
   - JWKS otspunkti kontroll

## Testide struktuur

Testid on organiseeritud Mocha `describe` ja `it` plokkidesse, mis järgivad API loogilist struktuuri. Iga test sisaldab ka veaolukordade käsitlemist ja ebaõnnestunud testide puhul logitakse curl käsk, mida saab kasutada probleemi manuaalseks uurimiseks.

## Märkused

- Testid loovad ajutisi kasutajaid ja kontosid, mis puhastatakse testide lõpus.
- Pankadevaheliste ülekannete testid kasutavad viitepangana Henno Panka (https://henno.cfd/henno-pank).
- Testid eeldavad, et OA-Pank API on kättesaadav aadressil https://hack2you.eu/oa-pank.
