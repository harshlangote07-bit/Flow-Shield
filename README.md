# 🌊 Flow Shield

### Intelligent Flood Risk Monitoring & Management System

Flow Shield is a full-stack flood-risk monitoring platform that combines weather, rainfall, rain-radar, drainage conditions, reports, and other available risk factors to calculate and visualize area-level flood risk.

For the current hackathon implementation, **selected areas of Bengaluru, Karnataka are used as the demonstration region** because a complete production-grade dataset for every location is not available. The architecture is designed to be reusable for other regions.

---

## 🚀 Features

- 🌧️ **Weather & Rainfall Monitoring**
  - Integrates external weather services for environmental information.
  - Uses weather data as an input to the flood-risk engine.

- 🌦️ **Rain / Radar Visualization**
  - Uses RainViewer data to provide precipitation/radar context where integrated.

- 🧮 **Multi-Factor Flood Risk Engine**
  - Combines multiple normalized risk factors.
  - Applies configured weights to produce an area-level risk score.
  - Converts the score into a user-friendly risk category.

- 🗺️ **Interactive Flood-Risk Map**
  - Built with Leaflet and React Leaflet.
  - Uses GeoJSON area/zone boundaries.
  - Uses OpenStreetMap map data/tiles where configured.

- 🚧 **Drainage Monitoring**
  - Includes drainage-related information in the risk workflow.
  - Supports drainage reports and official drainage-condition updates.

- 👮 **Official Drainage Workflow**
  - Separates reported/unverified information from official operational updates.
  - Helps protect the risk calculation from arbitrary public changes to official drainage status.

- 📍 **Area-Level Monitoring**
  - Risk is calculated for configured areas rather than treating the whole region as one value.

- 🗄️ **MongoDB Persistence**
  - Stores application data for backend operations.

- 🔄 **Scheduled Weather Refresh**
  - Backend periodically refreshes available weather information.

- 📊 **Dashboard**
  - Presents risk information, area details, environmental information, and map-based visualization.

---

## 🎯 Problem Statement

Flooding is influenced by multiple conditions, not rainfall alone.

Two areas experiencing similar rainfall can have different flood-risk levels because of:

- drainage condition,
- drainage blockage,
- rainfall intensity,
- weather conditions,
- waterlogging/flood reports,
- and other configured area-level factors.

Flow Shield addresses this by combining available signals into an understandable **area-level flood-risk assessment**.

---

## 💡 How It Works

```text
Weather / Forecast Data
          +
Rain / Radar Information
          +
Drainage Conditions
          +
Reports / Other Risk Factors
          ↓
     Risk Engine
          ↓
Normalization + Weighting
          ↓
   Composite Risk Score
          ↓
     Risk Category
          ↓
 Dashboard + Interactive Map
```

---

# 🧮 Risk Calculation

The core risk engine uses a weighted combination of normalized factors.

A simplified representation is:

```text
Risk Score = Σ (Weight × Normalized Factor)
```

Conceptually:

```text
Rainfall
   +
Weather
   +
Drainage Condition
   +
Drainage Blockage
   +
Other Configured Factors
        ↓
Composite Risk Score
        ↓
Risk Level
```

The backend owns the calculation so that the risk logic remains centralized and consistent.

> Exact weights and thresholds are implementation-specific and can be recalibrated when better real-world datasets become available.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │   External Sources   │
                         │                      │
                         │ WeatherAPI           │
                         │ Open-Meteo           │
                         │ RainViewer           │
                         └──────────┬───────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────┐
│                     BACKEND                           │
│                                                       │
│ Routes → Controllers → Services → Risk Engine         │
│                         │                             │
│                         ▼                             │
│                      MongoDB                          │
│                                                       │
│              Scheduled Weather Refresh                │
└───────────────────────┬───────────────────────────────┘
                        │
                     REST API
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                    FRONTEND                           │
│                                                       │
│ React + Vite + React Leaflet + Leaflet + GeoJSON      │
│                                                       │
│ Dashboard → Risk Map → Area Details → Drainage       │
└───────────────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- **React** — user interface
- **Vite** — development server and build tooling
- **React Leaflet** — React integration for Leaflet
- **Leaflet** — interactive map rendering
- **GeoJSON** — geographic zone/area representation
- JavaScript / JSX
- CSS

## Backend

- **Node.js** — backend runtime
- **Express.js** — REST API framework
- Controllers
- Services
- Routes
- Scheduled background processing

## Database

- **MongoDB** — persistent application data

---

# 🔌 APIs & External Services

Flow Shield uses external services for environmental and geographic information.

## 🌦️ WeatherAPI

**Purpose:** Weather information used as an input to the flood-risk workflow.

The service can provide weather-related information such as current conditions and rainfall-related values depending on the endpoint/configuration used by the application.

Official website:  
https://www.weatherapi.com/

---

## 🌤️ Open-Meteo

**Purpose:** Weather and forecast information used as an environmental input.

Open-Meteo provides weather/forecast data that can be consumed without requiring the application to maintain its own weather infrastructure.

Official website:  
https://open-meteo.com/

---

## 🌧️ RainViewer

**Purpose:** Rain/radar and precipitation visualization/context.

RainViewer is used for rainfall/radar-related information where integrated into the application.

Official website:  
https://www.rainviewer.com/

---

# 🗺️ Maps & Open-Source Technologies

## Leaflet

**Purpose:** Interactive map rendering.

Leaflet is an open-source JavaScript library used as the mapping foundation.

Official website:  
https://leafletjs.com/

---

## React Leaflet

**Purpose:** React components and integration for Leaflet maps.

Official documentation:  
https://react-leaflet.js.org/

---

## OpenStreetMap

**Purpose:** Open geographic map data / base-map information where used by the application.

Map data attribution:

> © OpenStreetMap contributors

Website:  
https://www.openstreetmap.org/

OpenStreetMap data is provided under the **Open Data Commons Open Database License (ODbL)**. Follow the applicable attribution and tile-usage requirements when deploying the project.

---

## GeoJSON

**Purpose:** Represents geographic boundaries for configured Bengaluru areas/zones.

The frontend currently uses:

```text
frontend/src/data/bengaluruZones.json
```

GeoJSON is an open standard for encoding geographic data structures.

---

# 🙏 API & Open-Source Attribution

Flow Shield acknowledges the external services and open-source projects used by the application:

| Technology / Service | Purpose |
|---|---|
| WeatherAPI | Weather information |
| Open-Meteo | Weather / forecast information |
| RainViewer | Rain / radar information |
| Leaflet | Interactive maps |
| React Leaflet | React mapping integration |
| OpenStreetMap | Map/geographic data |
| GeoJSON | Geographic area representation |
| React | Frontend application |
| Vite | Frontend tooling |
| Node.js | Backend runtime |
| Express.js | Backend API |
| MongoDB | Database |

> API availability, terms, attribution requirements, rate limits, and licensing conditions are subject to the respective providers. Production deployments should comply with the current terms of each service.

---

# 📂 Project Structure

```text
Flow-Shield/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── data/
│   │   │   └── bengaluruZones.json
│   │   └── ...
│   │
│   └── package.json
│
└── README.md
```

---

# 🔄 Application Data Flow

### 1. External Data

Weather and rain-related information is obtained through configured external services.

```text
WeatherAPI
    +
Open-Meteo
    +
RainViewer
```

### 2. Backend Processing

The backend receives/processes the available information.

```text
API Data
   ↓
Backend Services
   ↓
Database / Risk Inputs
```

### 3. Risk Calculation

```text
Risk Inputs
   ↓
Normalization
   ↓
Configured Weights
   ↓
Risk Score
   ↓
Risk Category
```

### 4. Frontend

The frontend consumes backend APIs and presents the information through:

- dashboard,
- map,
- area details,
- drainage information,
- and risk indicators.

---

# 🚧 Drainage Management

Drainage conditions are an important component of the risk model.

Flow Shield distinguishes between:

```text
User Report
     ↓
Reported / Unverified Information
```

and:

```text
Authorized Official Update
     ↓
Official Drainage Condition
```

This prevents an arbitrary user from directly changing an official drainage state that can influence flood-risk calculations.

---

# 🗺️ Bengaluru Demonstration Region

Flow Shield is a **general flood-risk platform**.

The current hackathon implementation uses selected **Bengaluru areas** as the working/demonstration region.

This allows the team to demonstrate:

- localized flood risk,
- map visualization,
- weather integration,
- rainfall/radar context,
- drainage conditions,
- and the risk calculation workflow.

The architecture can later be extended to additional cities or regions by adding appropriate datasets and area configuration.

---

# 🌐 Backend API Architecture

The backend follows:

```text
HTTP Request
     ↓
Route
     ↓
Controller
     ↓
Service
     ↓
Database / External API
     ↓
Risk / Business Logic
     ↓
HTTP Response
```

This separates:

- HTTP handling,
- business logic,
- database operations,
- external API integration,
- and risk calculations.

---

# 🗄️ MongoDB

MongoDB is used for persistent application data.

The backend establishes a MongoDB connection during startup.

Example development output:

```text
MongoDB connected successfully
```

MongoDB allows the application to maintain data across server restarts rather than relying only on temporary frontend state.

---

# 🔄 Weather Scheduler

The backend includes a scheduled weather-refresh process.

Conceptually:

```text
Scheduled Refresh
       ↓
Weather API
       ↓
Process Weather Data
       ↓
Update Database
       ↓
Risk Engine
```

The refresh interval is configurable in the backend.

---

# ⚙️ Getting Started

## Prerequisites

Install:

- Node.js
- npm
- MongoDB
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/harshlangote07-bit/Flow-Shield.git
cd Flow-Shield
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Configure the environment variables required by the backend.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
WEATHER_API_KEY=your_weather_api_key
```

Use the exact variable names defined by the current project configuration.

Start the backend using the script defined in `backend/package.json`, for example:

```bash
npm run dev
```

---

## 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL.

---

# 🔐 Environment Variables

Never commit:

- API keys
- passwords
- MongoDB credentials
- private tokens

to GitHub.

Use a local `.env` file and keep it in `.gitignore`.

---

# 🧪 Testing Checklist

After starting the application:

- [ ] Dashboard loads
- [ ] Risk map loads
- [ ] Bengaluru GeoJSON boundaries render
- [ ] Weather information loads
- [ ] Rain/radar information loads where configured
- [ ] Area selection works
- [ ] Risk calculation returns a result
- [ ] Drainage information loads
- [ ] Official drainage workflow works
- [ ] MongoDB connection succeeds
- [ ] Backend APIs respond correctly
- [ ] No frontend console errors occur

---

# 📌 Current Project Scope

The current implementation is a **hackathon prototype / proof of concept**.

The main objective is to demonstrate the complete technical pipeline:

```text
External APIs
      ↓
Backend
      ↓
MongoDB
      ↓
Risk Engine
      ↓
REST APIs
      ↓
React Frontend
      ↓
Interactive Map + Dashboard
```

Because a complete real-world dataset is not currently available for every location, selected Bengaluru areas are used for the demonstration.

The risk model is therefore a **configured mathematical model**, not a guaranteed prediction of exact flood depth, location, or timing.

---

# 🔮 Future Improvements

Potential extensions include:

- Real-time IoT water-level sensors
- More detailed rainfall datasets
- Historical flood datasets
- Live drainage sensors
- More accurate geographic datasets
- Automated alerts
- SMS / notification integration
- Satellite / remote-sensing data
- Machine-learning-based model calibration
- Historical risk analytics
- Additional cities and regions
- Advanced role-based authentication
- Emergency-response integration

---

# 👥 Contributors

Flow Shield was developed collaboratively as a hackathon project.

- **Harsh Langote**
- **Sharad Kumar**
- **Govind**

---

# 🔗 Repository

**GitHub:**  
https://github.com/harshlangote07-bit/Flow-Shield

---

# 📄 License

This project is currently developed as a hackathon project.

An appropriate open-source license can be added before public distribution.

---

## ⭐ Flow Shield

**Turning weather, rainfall, drainage, and geographic information into actionable flood-risk insights.**
