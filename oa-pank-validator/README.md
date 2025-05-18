# OA-Pank API Validator

API validaator OA-Pank rakenduse jaoks, mis kontrollib API vastavust OpenAPI spetsifikatsioonile.

## Funktsioonid

- Valideerib API endpointe vastavalt OpenAPI spetsifikatsioonile
- Kontrollib vastuste vastavust dokumenteeritud skeemidele
- Tuvastab puuduvad väljad ja dokumenteerimata staatuskoodid
- Toetab autentimist nõudvate endpointide testimist
- Genereerib detailse raporti leitud probleemidest

## Paigaldamine

```bash
npm install
```

## Kasutamine

Validaatorit saab käivitada järgmise käsuga:

```bash
node index.js [options]
```

### Võimalikud parameetrid

- `-u, --url <url>` - API baas URL (vaikimisi: `http://localhost:3001`)
- `-f, --file <file>` - OpenAPI spetsifikatsiooni fail (vaikimisi: `./swagger.yaml`)
- `-v, --verbose` - Detailsem väljund
- `-t, --token <token>` - JWT autentimistoken
- `-c, --create-user` - Loo kasutaja ja genereeri token automaatselt
- `-s, --skip-auth` - Jäta autentimist nõudvad endpointid vahele
- `-h, --help` - Kuva abiteave
- `-V, --version` - Kuva versioon

### Näited

Validaatori käivitamine lokaalse API vastu:
```bash
node index.js
```

Validaatori käivitamine kaugserveri vastu:
```bash
node index.js --url https://api.oa-pank.example.com
```

Validaatori käivitamine detailse väljundiga:
```bash
node index.js --verbose
```

Autentimist nõudvate endpointide testimine automaatse kasutaja loomisega:
```bash
node index.js --create-user
```

## Valideerimise tulemused

Valideerimise tulemusena kuvatakse:
- Kokkuvõte testitud endpointidest
- Õnnestunud valideerimiste arv
- Ebaõnnestunud valideerimiste arv
- Vahele jäetud endpointide arv
- Detailne nimekiri leitud probleemidest kategooriate kaupa

## Arendamine

Validaatori arendamiseks:

```bash
npm run dev
```

See käivitab validaatori nodemon'iga, mis jälgib failimuudatusi ja taaskäivitab rakenduse automaatselt.

## Projekti struktuur

- `index.js` - Rakenduse peamine sisendpunkt ja CLI
- `src/validator.js` - API valideerimise põhiloogika
- `src/response-validator.js` - Vastuste valideerimise loogika
- `src/auth-helper.js` - Autentimise abifunktsioonid

## Litsents

MIT
