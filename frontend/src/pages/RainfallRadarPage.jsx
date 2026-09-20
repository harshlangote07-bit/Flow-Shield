import { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  LayersControl,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PageHeading from "../components/PageHeading";

import {
  getAreas,
  getWeather,
} from "../services/api";

import {
  getRainViewerData,
  getRadarStatus,
} from "../services/weatherService";

const { BaseLayer } = LayersControl;

/* =========================================================
   RADAR LAYER
========================================================= */

function RadarLayer({ tileUrl }) {
  const map = useMap();

  useEffect(() => {
    if (!tileUrl) return;

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

/* =========================================================
   HELPERS
========================================================= */

function getAreaId(area) {
  return area?.areaId ?? area?._id ?? "";
}

function getCoordinates(area) {
  return {
    lat:
      Number(
        area?.centroid?.latitude ??
          area?.location?.latitude ??
          12.9716,
      ),

    lon:
      Number(
        area?.centroid?.longitude ??
          area?.location?.longitude ??
          77.5946,
      ),
  };
}

function formatTime(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function weatherDescription(code) {
  const numericCode = Number(code);

  if (!Number.isFinite(numericCode)) {
    return "Weather data available";
  }

  if (numericCode === 0) {
    return "Clear sky";
  }

  if ([1, 2, 3].includes(numericCode)) {
    return "Cloudy";
  }

  if ([45, 48].includes(numericCode)) {
    return "Foggy";
  }

  if (
    [51, 53, 55, 56, 57].includes(
      numericCode,
    )
  ) {
    return "Drizzle";
  }

  if (
    [61, 63, 65, 66, 67].includes(
      numericCode,
    )
  ) {
    return "Rain";
  }

  if (
    [71, 73, 75, 77].includes(
      numericCode,
    )
  ) {
    return "Snow";
  }

  if (
    [80, 81, 82].includes(
      numericCode,
    )
  ) {
    return "Rain showers";
  }

  if (
    [95, 96, 99].includes(
      numericCode,
    )
  ) {
    return "Thunderstorm";
  }

  return "Weather conditions";
}

/* =========================================================
   RAINFALL RADAR PAGE
========================================================= */

export default function RainfallRadarPage() {
  const [areas, setAreas] = useState([]);

  const [selectedAreaId, setSelectedAreaId] =
    useState("");

  const [weatherData, setWeatherData] =
    useState(null);

  const [weatherLoading, setWeatherLoading] =
    useState(true);

  const [weatherError, setWeatherError] =
    useState("");

  const [radarData, setRadarData] =
    useState(null);

  const [radarTileUrl, setRadarTileUrl] =
    useState("");

  const [radarStatus, setRadarStatus] =
    useState(null);

  const [radarLoading, setRadarLoading] =
    useState(true);

  const [radarError, setRadarError] =
    useState("");

  /* =========================================================
     LOAD AREAS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAreas() {
      try {
        const response =
          await getAreas();

        if (cancelled) return;

        const nextAreas =
          Array.isArray(response?.data)
            ? response.data
            : [];

        setAreas(nextAreas);

        if (nextAreas.length) {
          setSelectedAreaId(
            getAreaId(nextAreas[0]),
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Weather areas error:",
          error,
        );

        setWeatherError(
          error?.message ||
            "Unable to load monitored areas.",
        );
      }
    }

    loadAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     LOAD BACKEND WEATHER
  ========================================================= */

  useEffect(() => {
    if (!selectedAreaId) return;

    let cancelled = false;

    async function loadWeather() {
      try {
        setWeatherLoading(true);
        setWeatherError("");

        /*
         * This hits:
         *
         * GET /api/weather/:areaId
         *
         * The backend fetches Open-Meteo data,
         * persists it in MongoDB, and returns the
         * latest observation + forecast.
         */
        const response =
          await getWeather(
            selectedAreaId,
          );

        if (cancelled) return;

        setWeatherData(
          response?.data ?? null,
        );
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Backend weather error:",
          error,
        );

        setWeatherError(
          error?.message ||
            "Unable to load backend weather data.",
        );
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [selectedAreaId]);

  /* =========================================================
     LOAD RADAR
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadRadar() {
      try {
        setRadarLoading(true);
        setRadarError("");

        /*
         * Radar visualization remains RainViewer because
         * the Flow Shield backend currently stores weather
         * observations/forecasts, not radar tile frames.
         */
        const data =
          await getRainViewerData();

        if (cancelled) return;

        setRadarData(data);
        setRadarStatus(
          getRadarStatus(data),
        );

        const pastFrames =
          data?.radar?.past || [];

        if (pastFrames.length > 0) {
          const latestFrame =
            pastFrames[
              pastFrames.length - 1
            ];

          setRadarTileUrl(
            `https://tilecache.rainviewer.com${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`,
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Radar error:",
          error,
        );

        setRadarError(
          "Unable to load rainfall radar.",
        );
      } finally {
        if (!cancelled) {
          setRadarLoading(false);
        }
      }
    }

    loadRadar();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const selectedArea =
    areas.find(
      (area) =>
        getAreaId(area) ===
        selectedAreaId,
    ) || null;

  const coordinates =
    getCoordinates(selectedArea);

  const observation =
    weatherData?.current ?? null;

  const forecast =
    weatherData?.forecast ?? null;

  const observations =
    weatherData?.observations ?? [];

  const forecasts =
    weatherData?.forecasts ?? [];

  const latestRadarTimestamp =
    radarData?.radar?.past?.[
      radarData?.radar?.past?.length - 1
    ]?.time;

  const formattedRadarTime =
    latestRadarTimestamp
      ? formatTime(
          latestRadarTimestamp * 1000,
        )
      : "--";

  const rainfall1h = Number(
    observation?.rainfall1h ?? 0,
  );

  const rainfall3h = Number(
    observation?.rainfall3h ?? 0,
  );

  const rainfall6h = Number(
    observation?.rainfall6h ?? 0,
  );

  const rainfall24h = Number(
    observation?.rainfall24h ?? 0,
  );

  const precipitationProbability =
    Number(
      observation?.precipitationProbability ??
        forecast?.precipitationProbability ??
        0,
    );

  const forecast3h = Number(
    forecast?.forecast3h ?? 0,
  );

  const forecast6h = Number(
    forecast?.forecast6h ?? 0,
  );

  const temperature =
    Number(
      observation?.temperatureC ?? 0,
    );

  const humidity =
    Number(
      observation?.humidityPercent ?? 0,
    );

  const windSpeed =
    Number(
      observation?.windSpeedMps ?? 0,
    );

  const weatherCondition =
    weatherDescription(
      observation?.weatherCondition,
    );

  /*
   * Build a small recent-observation list from
   * actual MongoDB weather history.
   */
  const recentObservations =
    useMemo(() => {
      return [...observations]
        .sort(
          (a, b) =>
            new Date(b.observedAt) -
            new Date(a.observedAt),
        )
        .slice(0, 6);
    }, [observations]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page">
      <PageHeading
        eyebrow="Live weather intelligence"
        title="Rainfall radar"
        subtitle="Live precipitation radar with weather observations and rainfall forecasts from the Flow Shield backend."
        action={
          <div className="risk-chip low">
            <span className="status-dot" />
            Backend weather live
          </div>
        }
      />

      {/* =====================================================
          AREA SELECTOR
      ===================================================== */}

      <div
        className="panel"
        style={{
          marginBottom: 16,
          padding: 16,
        }}
      >
        <div className="field">
          <label htmlFor="weather-area">
            Monitored area
          </label>

          <select
            id="weather-area"
            className="select"
            value={selectedAreaId}
            onChange={(event) =>
              setSelectedAreaId(
                event.target.value,
              )
            }
          >
            {areas.map((area) => (
              <option
                key={getAreaId(area)}
                value={getAreaId(area)}
              >
                {area.name ||
                  getAreaId(area)}
              </option>
            ))}
          </select>

          <p className="form-help">
            Weather values below come from the selected
            monitored area.
          </p>
        </div>
      </div>

      {(weatherError || radarError) && (
        <div className="recommendation">
          <strong>
            Weather data warning
          </strong>

          <p>
            {weatherError ||
              radarError}
          </p>
        </div>
      )}

      {/* =====================================================
          RADAR + FORECAST
      ===================================================== */}

      <section className="radar-layout">
        {/* ===================================================
            RADAR
        =================================================== */}

        <div className="radar-card">
          <div className="radar-card-header">
            <div>
              <span className="card-label">
                PRECIPITATION RADAR
              </span>

              <h2>
                Live rainfall activity
              </h2>
            </div>

            <div className="radar-time">
              Latest frame:{" "}
              <strong>
                {formattedRadarTime}
              </strong>
            </div>
          </div>

          <div className="radar-map">
            {radarLoading ? (
              <div className="radar-loading">
                Loading radar...
              </div>
            ) : (
              <MapContainer
                center={[
                  coordinates.lat,
                  coordinates.lon,
                ]}
                zoom={10}
                scrollWheelZoom={true}
                style={{
                  height: "100%",
                  width: "100%",
                }}
              >
                <LayersControl position="topright">
                  <BaseLayer
                    checked
                    name="Street map"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </BaseLayer>

                  <BaseLayer name="Dark map">
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                  </BaseLayer>

                  <LayersControl.Overlay
                    checked
                    name="RainViewer precipitation"
                  >
                    <RadarLayer
                      tileUrl={
                        radarTileUrl
                      }
                    />
                  </LayersControl.Overlay>
                </LayersControl>
              </MapContainer>
            )}

            <div className="radar-legend">
              <span>Light</span>

              <div className="legend-gradient" />

              <span>Heavy</span>
            </div>
          </div>

          <div className="radar-attribution">
            Radar visualization by RainViewer
            {radarStatus?.label
              ? ` · ${radarStatus.label}`
              : ""}
          </div>
        </div>

        {/* ===================================================
            WEATHER / FORECAST
        =================================================== */}

        <aside className="forecast-card">
          <span className="card-label">
            BACKEND WEATHER
          </span>

          <div className="current-weather">
            <span className="card-label">
              CURRENT CONDITIONS
            </span>

            {weatherLoading ? (
              <div className="current-weather-loading">
                Loading Open-Meteo data...
              </div>
            ) : observation ? (
              <div className="current-weather-main">
                <div>
                  <strong>
                    {weatherCondition}
                  </strong>

                  <span>
                    {weatherData?.areaName ||
                      selectedArea?.name ||
                      "Monitored area"}{" "}
                    ·{" "}
                    {Math.round(
                      temperature,
                    )}
                    °C
                  </span>
                </div>

                <div className="current-weather-rain">
                  {rainfall1h.toFixed(1)} mm

                  <small>
                    rainfall / 1 hour
                  </small>
                </div>
              </div>
            ) : (
              <div className="current-weather-error">
                No current weather observation
                available.
              </div>
            )}
          </div>

          <h2>
            Coming next
          </h2>

          <div className="forecast-content">
            {weatherLoading ? (
              <div className="forecast-loading">
                Loading rainfall forecast...
              </div>
            ) : forecast ? (
              <>
                <div className="forecast-location">
                  <span>
                    MONITORED AREA
                  </span>

                  <strong>
                    {weatherData?.areaName ||
                      selectedArea?.name ||
                      selectedAreaId}
                  </strong>
                </div>

                {/* FORECAST SUMMARY */}

                <div className="forecast-list">
                  <div className="forecast-row">
                    <div className="forecast-row-time">
                      Next 3h
                    </div>

                    <div className="forecast-row-weather">
                      <span>
                        Expected rainfall
                      </span>

                      <small>
                        {
                          forecast3h.toFixed(
                            1,
                          )
                        }{" "}
                        mm
                      </small>
                    </div>

                    <strong className="forecast-rain">
                      {precipitationProbability.toFixed(
                        0,
                      )}
                      %
                    </strong>
                  </div>

                  <div className="forecast-row">
                    <div className="forecast-row-time">
                      Next 6h
                    </div>

                    <div className="forecast-row-weather">
                      <span>
                        Expected rainfall
                      </span>

                      <small>
                        {
                          forecast6h.toFixed(
                            1,
                          )
                        }{" "}
                        mm
                      </small>
                    </div>

                    <strong className="forecast-rain">
                      {Math.round(
                        forecast
                          .precipitationProbability ??
                          0,
                      )}
                      %
                    </strong>
                  </div>

                  <div className="forecast-row">
                    <div className="forecast-row-time">
                      Current
                    </div>

                    <div className="forecast-row-weather">
                      <span>
                        Temperature
                      </span>

                      <small>
                        Humidity{" "}
                        {Math.round(
                          humidity,
                        )}
                        %
                      </small>
                    </div>

                    <strong className="forecast-rain">
                      {Math.round(
                        temperature,
                      )}
                      °C
                    </strong>
                  </div>

                  <div className="forecast-row">
                    <div className="forecast-row-time">
                      Wind
                    </div>

                    <div className="forecast-row-weather">
                      <span>
                        Wind speed
                      </span>

                      <small>
                        Open-Meteo
                      </small>
                    </div>

                    <strong className="forecast-rain">
                      {windSpeed.toFixed(
                        1,
                      )}{" "}
                      m/s
                    </strong>
                  </div>
                </div>

                <div
                  className="recommendation"
                  style={{
                    marginTop: 14,
                  }}
                >
                  <strong>
                    Rainfall history
                  </strong>

                  <p>
                    {rainfall1h.toFixed(
                      1,
                    )}{" "}
                    mm / 1h ·{" "}
                    {rainfall3h.toFixed(
                      1,
                    )}{" "}
                    mm / 3h ·{" "}
                    {rainfall6h.toFixed(
                      1,
                    )}{" "}
                    mm / 6h ·{" "}
                    {rainfall24h.toFixed(
                      1,
                    )}{" "}
                    mm / 24h
                  </p>
                </div>

                <div
                  className="mono tiny muted"
                  style={{
                    marginTop: 10,
                  }}
                >
                  Forecast generated:{" "}
                  {formatDateTime(
                    forecast.forecastGeneratedAt,
                  )}
                </div>
              </>
            ) : (
              <div className="forecast-error">
                No rainfall forecast available.
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* =====================================================
          RECENT MONGODB WEATHER HISTORY
      ===================================================== */}

      <section
        className="panel"
        style={{
          marginTop: 16,
        }}
      >
        <div className="panel-header">
          <div>
            <div className="panel-kicker">
              MongoDB weather history
            </div>

            <h2>
              Recent observations
            </h2>
          </div>

          <span className="mono tiny muted">
            Open-Meteo
          </span>
        </div>

        {recentObservations.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Observed</th>
                  <th>Rain 1h</th>
                  <th>Rain 3h</th>
                  <th>Rain 24h</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                </tr>
              </thead>

              <tbody>
                {recentObservations.map(
                  (item, index) => (
                    <tr
                      key={
                        item?._id ??
                        item?.observedAt ??
                        index
                      }
                    >
                      <td>
                        {formatDateTime(
                          item.observedAt,
                        )}
                      </td>

                      <td>
                        {Number(
                          item.rainfall1h ??
                            0,
                        ).toFixed(1)}{" "}
                        mm
                      </td>

                      <td>
                        {Number(
                          item.rainfall3h ??
                            0,
                        ).toFixed(1)}{" "}
                        mm
                      </td>

                      <td>
                        {Number(
                          item.rainfall24h ??
                            0,
                        ).toFixed(1)}{" "}
                        mm
                      </td>

                      <td>
                        {Math.round(
                          Number(
                            item.temperatureC ??
                              0,
                          ),
                        )}
                        °C
                      </td>

                      <td>
                        {Math.round(
                          Number(
                            item.humidityPercent ??
                              0,
                          ),
                        )}
                        %
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert-detail-empty">
            No persisted weather observations are
            available yet.
          </div>
        )}
      </section>

      {/* =====================================================
          BACKEND SOURCE
      ===================================================== */}

      <div
        className="mono tiny muted"
        style={{
          marginTop: 10,
        }}
      >
        Weather source: Open-Meteo → Flow Shield
        backend → MongoDB
        {forecasts.length
          ? ` · ${forecasts.length} stored forecast records`
          : ""}
      </div>
    </div>
  );
}