import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    LayersControl,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
    getRainViewerData,
    getRainForecast,
    getCurrentWeather,
    getRadarStatus,
} from "../services/weatherService";

const { BaseLayer } = LayersControl;

function RadarLayer({ tileUrl }) {
    const map = useMap();

    useEffect(() => {
        if (!tileUrl) return;

        // Radar tiles are added manually so we can switch
        // to the latest available RainViewer frame.

        const layer = L.tileLayer(tileUrl, {
            opacity: 0.7,
            tileSize: 256,
            maxNativeZoom: 7,
            maxZoom: 18,
            attribution:
                '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
        });

        layer.addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [map, tileUrl]);

    return null;
}

export default function RainfallRadarPage() {
    const [radarData, setRadarData] = useState(null);
    const [radarTileUrl, setRadarTileUrl] = useState("");
    const [radarStatus, setRadarStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentWeather, setCurrentWeather] = useState(null);
    const [currentWeatherLoading, setCurrentWeatherLoading] = useState(true);
    const [currentWeatherError, setCurrentWeatherError] = useState("");

    const [forecast, setForecast] = useState(null);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [forecastError, setForecastError] = useState("");
    const FORECAST_LOCATION = {
        lat: 12.9716,
        lon: 77.5946,
        name: "Bengaluru",
    };

    useEffect(() => {
        async function loadRadar() {
            try {
                setLoading(true);
                setError("");

                const data = await getRainViewerData();

                setRadarData(data);
                setRadarStatus(getRadarStatus(data));

                const pastFrames = data?.radar?.past || [];

                if (pastFrames.length > 0) {
                    const latestFrame = pastFrames[pastFrames.length - 1];

                    setRadarTileUrl(
                        `https://tilecache.rainviewer.com${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
                    );
                }
            } catch (err) {
                console.error(err);
                setError("Unable to load rainfall radar.");
            } finally {
                setLoading(false);
            }
        }

        loadRadar();
    }, []);

    useEffect(() => {
        async function loadCurrentWeather() {
            try {
                setCurrentWeatherLoading(true);
                setCurrentWeatherError("");

                const data = await getCurrentWeather(
                    FORECAST_LOCATION.lat,
                    FORECAST_LOCATION.lon
                );

                setCurrentWeather(data);
            } catch (err) {
                console.error(err);
                setCurrentWeatherError(err.message);
            } finally {
                setCurrentWeatherLoading(false);
            }
        }

        loadCurrentWeather();
    }, []);

    useEffect(() => {
        async function loadForecast() {
            try {
                setForecastLoading(true);
                setForecastError("");

                const data = await getRainForecast(
                    FORECAST_LOCATION.lat,
                    FORECAST_LOCATION.lon
                );

                setForecast(data);
            } catch (err) {
                console.error(err);
                setForecastError(err.message);
            } finally {
                setForecastLoading(false);
            }
        }

        loadForecast();
    }, []);

    const latestTimestamp =
        radarData?.radar?.past?.[
            radarData.radar.past.length - 1
        ]?.time;

    const formattedTime = latestTimestamp
        ? new Date(latestTimestamp * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
        : "--";

    return (
        <main className="page-shell">
            <section className="page-header">
                <div>
                    <p className="eyebrow">LIVE WEATHER INTELLIGENCE</p>

                    <h1>Rainfall radar</h1>

                    <p className="page-subtitle">
                        Real-time precipitation radar with rainfall forecasting.
                    </p>
                </div>

                <div className="status-chip">
                    <span className="status-dot" />
                    Radar live
                </div>
            </section>

            {error && (
                <div className="alert-card danger">
                    {error}
                </div>
            )}

            <section className="radar-layout">
                <div className="radar-card">
                    <div className="radar-card-header">
                        <div>
                            <span className="card-label">PRECIPITATION RADAR</span>
                            <h2>Live rainfall activity</h2>
                        </div>

                        <div className="radar-time">
                            Latest frame: <strong>{formattedTime}</strong>
                        </div>
                    </div>

                    <div className="radar-map">
                        {loading ? (
                            <div className="radar-loading">
                                Loading radar...
                            </div>
                        ) : (
                            <MapContainer
                                center={[12.9716, 77.5946]}
                                zoom={10}
                                scrollWheelZoom={true}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <LayersControl position="topright">
                                    <BaseLayer
                                        checked
                                        name="Street map"
                                    >
                                        <TileLayer
                                            attribution='&copy; OpenStreetMap contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                    </BaseLayer>

                                    <BaseLayer name="Dark map">
                                        <TileLayer
                                            attribution='&copy; OpenStreetMap contributors'
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        />
                                    </BaseLayer>

                                    <LayersControl.Overlay
                                        checked
                                        name="OpenWeather precipitation"
                                    >
                                        <TileLayer
                                            attribution="&copy; OpenWeather"
                                            url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`}
                                            opacity={0.65}
                                        />
                                    </LayersControl.Overlay>
                                </LayersControl>

                                <RadarLayer tileUrl={radarTileUrl} />
                            </MapContainer>
                        )}

                        <div className="radar-legend">
                            <span>Light</span>

                            <div className="legend-gradient" />

                            <span>Heavy</span>
                        </div>
                    </div>

                    <div className="radar-attribution">
                        Radar data by RainViewer
                    </div>
                </div>

                <aside className="forecast-card">
                    <span className="card-label">RAINFALL FORECAST</span>

                    <div className="current-weather">
                        <span className="card-label">CURRENT CONDITIONS</span>

                        {currentWeatherLoading && (
                            <div className="current-weather-loading">
                                Loading current weather...
                            </div>
                        )}

                        {currentWeatherError && (
                            <div className="current-weather-error">
                                {currentWeatherError}
                            </div>
                        )}

                        {currentWeather && (
                            <div className="current-weather-main">
                                <div>
                                    <strong>
                                        {currentWeather.weather?.[0]?.description || "No data"}
                                    </strong>

                                    <span>
                                        Bengaluru · {Math.round(currentWeather.main?.temp ?? 0)}°C
                                    </span>
                                </div>

                                <div className="current-weather-rain">
                                    {currentWeather.rain?.["1h"]
                                        ? `${currentWeather.rain["1h"]} mm`
                                        : "0.0 mm"}
                                    <small>rain / last hour</small>
                                </div>
                            </div>
                        )}
                    </div>

                    <h2>Coming next</h2>

                    <div className="forecast-content">
                        {forecastLoading && (
                            <div className="forecast-loading">
                                Loading rainfall forecast...
                            </div>
                        )}

                        {forecastError && (
                            <div className="forecast-error">
                                {forecastError}
                            </div>
                        )}

                        {forecast && (
                            <>
                                <div className="forecast-location">
                                    <span>LOCATION</span>
                                    <strong>{FORECAST_LOCATION.name}</strong>
                                </div>

                                <div className="forecast-list">
                                    {forecast.list.slice(0, 8).map((item) => {
                                        const rainfall = item.rain?.["3h"] || 0;
                                        const probability = Math.round(
                                            (item.pop || 0) * 100
                                        );

                                        const time = new Date(
                                            item.dt * 1000
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });

                                        return (
                                            <div
                                                className="forecast-row"
                                                key={item.dt}
                                            >
                                                <div className="forecast-row-time">
                                                    {time}
                                                </div>

                                                <div className="forecast-row-weather">
                                                    <span>
                                                        {item.weather?.[0]?.description ||
                                                            "No data"}
                                                    </span>

                                                    <small>
                                                        {probability}% rain
                                                    </small>
                                                </div>

                                                <strong className="forecast-rain">
                                                    {rainfall.toFixed(1)} mm
                                                </strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </aside>
            </section>
        </main>
    );
}