# Smart Parking API — Documentação da API (Entrega Final)

Esta documentação descreve todos os endpoints disponíveis na API do projeto **Smart Parking**. A API serve dados para a plataforma móvel e web e comunica com a Base de Dados MySQL via Sequelize ORM.

---

## 📌 Configuração Geral
* **Base URL**: `http://localhost:3000`
* **Autenticação**: Enviar o JWT Token nos cabeçalhos (Headers) das rotas protegidas:
  ```http
  Authorization: Bearer <seu_token_jwt>
  ```

---

## 1. Autenticação e Utilizadores (`/users`)

### `POST /users/register`
Regista um novo utilizador no sistema. Opcionalmente, pode associar uma matrícula inicial.

* **Corpo da Requisição (JSON)**:
  ```json
  {
    "name": "Aristides Paris",
    "email": "aristides@email.com",
    "password": "senha_segura",
    "contact": "912345678",
    "plate": "AA-00-BB"
  }
  ```
* **Resposta de Sucesso (201 Created)**:
  ```json
  {
    "message": "Utilizador criado",
    "user": { "id": 1, "name": "Aristides Paris", "email": "aristides@email.com" }
  }
  ```

### `POST /users/login`
Autentica o utilizador e devolve o Token JWT.

* **Corpo da Requisição (JSON)**:
  ```json
  {
    "email": "aristides@email.com",
    "password": "senha_segura"
  }
  ```
* **Resposta de Sucesso (200 OK)**:
  ```json
  {
    "message": "Login com sucesso",
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Aristides Paris",
      "email": "aristides@email.com",
      "contact": "912345678",
      "role": "user"
    }
  }
  ```

### `GET /users/me` (Protegida)
Obtém o perfil do utilizador atualmente autenticado.

* **Resposta de Sucesso (200 OK)**:
  ```json
  {
    "id": 1,
    "name": "Aristides Paris",
    "email": "aristides@email.com",
    "contact": "912345678",
    "role": "user"
  }
  ```

### `PUT /users/me` (Protegida)
Atualiza os dados pessoais do utilizador autenticado.

* **Corpo da Requisição (JSON)**:
  ```json
  {
    "name": "Aristides Paris Silva",
    "email": "novo_email@email.com",
    "contact": "912345679"
  }
  ```
* **Resposta de Sucesso (200 OK)**:
  ```json
  {
    "message": "Perfil atualizado",
    "user": { ... }
  }
  ```

---

## 2. Gestão de Veículos (`/users/me/vehicles`)

### `GET /users/me/vehicles` (Protegida)
Lista todos os veículos associados à conta do utilizador.

* **Resposta de Sucesso (200 OK)**:
  ```json
  [
    {
      "id_vehicle": 1,
      "license_plate": "AA-00-BB",
      "brand": "Toyota",
      "model": "Corolla",
      "color": "Preto",
      "vehicle_type": "Gasolina"
    }
  ]
  ```

### `POST /users/me/vehicles` (Protegida)
Associa um novo veículo ao utilizador autenticado.

* **Corpo da Requisição (JSON)**:
  ```json
  {
    "license_plate": "CC-11-DD",
    "brand": "Toyota",
    "model": "Yaris",
    "color": "Branco",
    "vehicle_type": "Híbrido"
  }
  ```
* **Resposta de Sucesso (201 Created)**:
  ```json
  {
    "message": "Veículo adicionado",
    "vehicle": { ... }
  }
  ```

### `DELETE /users/me/vehicles/:id` (Protegida)
Remove um veículo do utilizador (desde que não possua reservas ativas ou pendentes).

* **Resposta de Sucesso (200 OK)**:
  ```json
  { "message": "Veículo apagado com sucesso" }
  ```

---

## 3. Parques e Lugares (`/api/parks`)

### `GET /api/parks`
Lista todos os parques de estacionamento ativos e o respetivo número de lugares livres/totais.

* **Resposta de Sucesso (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Parque das Antas",
      "city": "Porto",
      "address": "Avenida dos Aliados, Porto",
      "capacity": 80,
      "available": 32,
      "open": "07:00",
      "close": "22:00",
      "lat": 41.163,
      "lng": -8.583,
      "img": "https://...",
      "price_per_hour": 1.50,
      "daily_ticket_price": 10.00
    }
  ]
  ```

### `GET /api/parks/:id/spots`
Lista todos os lugares associados a um parque e o seu estado atual (`free` ou `occupied`).

* **Resposta de Sucesso (200 OK)**:
  ```json
  [
    { "id_spot": 1, "number": 1, "status": "free", "id_park": 1 },
    { "id_spot": 2, "number": 2, "status": "occupied", "id_park": 1 }
  ]
  ```

---

## 4. Favoritos (`/users/me/favorites`)

### `GET /users/me/favorites` (Protegida)
Lista todos os parques marcados como favoritos pelo utilizador autenticado.

### `POST /users/me/favorites` (Protegida)
Adiciona um parque aos favoritos.

* **Corpo da Requisição (JSON)**:
  ```json
  { "id_park": 1 }
  ```

### `DELETE /users/me/favorites/:parkId` (Protegida)
Remove um parque dos favoritos.

---

## 5. Reservas e Pagamentos (`/reservations`)

### `POST /reservations` (Protegida)
Cria uma reserva de estacionamento. Se `pay_later` for `true`, o estado da reserva fica como `pending` (Pendente). Caso contrário, a reserva fica como `confirmed` (Confirmada).

* **Corpo da Requisição (JSON)**:
  ```json
  {
    "id_spot": 1,
    "id_vehicle": 1,
    "date": "2026-06-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "payment_method": "MBWay",
    "is_daily_ticket": false,
    "pay_later": false
  }
  ```
* **Resposta de Sucesso (201 Created)**:
  ```json
  {
    "message": "Reserva criada e paga com sucesso",
    "reservation": { "id_reservation": 10, "status": "confirmed", ... },
    "payment": { "amount": 3.00, "payment_status": "completed", ... }
  }
  ```

### `GET /reservations/me` (Protegida)
Lista todas as reservas associadas ao utilizador autenticado (inclui dados do lugar e pagamento).

* **Resposta de Sucesso (200 OK)**:
  ```json
  [
    {
      "id_reservation": 10,
      "date": "2026-06-15",
      "start_time": "14:00",
      "end_time": "16:00",
      "status": "confirmed",
      "ParkingSpot": { "id_spot": 1, "spot_number": 1, "id_park": 1 },
      "Payment": { "amount": 3.00, "payment_status": "completed" }
    }
  ]
  ```

### `PUT /reservations/:id/cancel` (Protegida)
Cancela uma reserva (apenas possível se a reserva ainda não tiver começado). Liberta o lugar correspondente na base de dados.

### `PUT /reservations/:id/pay` (Protegida)
Efetua o pagamento de uma reserva que foi criada em estado pendente.

* **Corpo da Requisição (JSON)**:
  ```json
  { "payment_method": "MBWay" }
  ```

---

## 6. Painel de Administração (`/admin`)
*(Todos estes endpoints exigem autenticação e privilégios de `ADMIN`)*

### `GET /admin/stats` (Protegida - Apenas Admin)
Obtém métricas gerais de utilização (Total de utilizadores, reservas, receita financeira total, ocupação de parques e evolução mensal).

### `GET /admin/users` (Protegida - Apenas Admin)
Lista todos os utilizadores registados no sistema.

### `PUT /admin/users/:id/status` (Protegida - Apenas Admin)
Bloqueia ou ativa um utilizador.
* **Corpo da Requisição**: `{ "account_status": "BLOCK" }` ou `{ "account_status": "ACTIVE" }`

### `GET /admin/reservations` (Protegida - Apenas Admin)
Obtém uma lista completa de todas as reservas do sistema com dados dos utilizadores e veículos associados.

### `POST /admin/parks` (Protegida - Apenas Admin)
Cria um parque de estacionamento e gera automaticamente todos os seus lugares associados com estado livre (`free`).

* **Corpo da Requisição (JSON)**:
  ```json
  {
    "name": "Parque Central",
    "address": "Rua Central, Porto",
    "city": "Porto",
    "total_capacity": 50,
    "opening_time": "08:00",
    "closing_time": "23:00",
    "lat": 41.15,
    "lng": -8.62,
    "price_per_hour": 1.20,
    "daily_ticket_price": 8.00
  }
  ```

### `PUT /admin/parks/:id` (Protegida - Apenas Admin)
Atualiza dados cadastrais, horários ou preços de um parque existente.

### `DELETE /admin/parks/:id` (Protegida - Apenas Admin)
Apaga um parque e remove todos os seus lugares associados em cascata.
