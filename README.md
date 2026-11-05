

Express.js and MongoDB API for the BookNook online library.

Client repo: https://github.com/shehadraza/boonook-client
Live site: https://boonook-client.vercel.app

## API Routes

| Method | Route | Access |
|--------|-------|--------|
| GET | /books | Public |
| GET | /books/:id | Private |
| POST | /books | Private |
| PATCH | /books/:id | Private |
| DELETE | /books/:id | Private |
| POST | /borrows | Private |
| GET | /borrows | Private |
| DELETE /borrows/:id | Private |

## Run Locally

git clone https://github.com/shehadraza/booknook-server.git
cd booknook-server
npm install
npm start

