import { useEffect, useState } from "react";

import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import PageHeading from "../components/PageHeading";

import {
  getAreas,
  getDrainage,
  updateDrainageAsset,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function getAreaId(area) {
  return area?.areaId ?? area?._id ?? "";
}

/*
 * IMPORTANT:
 * Drainage PATCH API expects the custom assetId,
 * NOT MongoDB's _id.
 */
function getAssetId(asset) {
  return asset?.assetId ?? asset?._id ?? "";
}

function formatTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAssetStatus(status) {
  return String(status || "operational")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

/* =========================================================
   OFFICIAL PORTAL
========================================================= */

export default function OfficialPage({
  officialUser,
}) {
  const [areas, setAreas] = useState([]);

  const [selectedAreaId, setSelectedAreaId] =
    useState("");

  const [assets, setAssets] = useState([]);

  /*
   * This MUST contain asset.assetId.
   * The backend PATCH route searches by assetId.
   */
  const [selectedAssetId, setSelectedAssetId] =
    useState("");

  const [form, setForm] = useState({
    blockagePercent: 0,
    capacityUtilizationPercent: 0,
    condition: "good",
    status: "operational",
  });

  const [step, setStep] =
    useState("edit");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD AREAS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAreas() {
      try {
        setLoading(true);

        const response = await getAreas();

        if (cancelled) return;

        const nextAreas = Array.isArray(
          response?.data,
        )
          ? response.data
          : [];

        setAreas(nextAreas);

        if (nextAreas.length) {
          setSelectedAreaId(
            getAreaId(nextAreas[0]),
          );
        }
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError?.message ||
            "Unable to load monitored areas.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     LOAD ASSETS FOR SELECTED AREA
  ========================================================= */

  useEffect(() => {
    if (!selectedAreaId) return;

    let cancelled = false;

    async function loadAssets() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response =
          await getDrainage(
            selectedAreaId,
          );

        if (cancelled) return;

        const nextAssets = Array.isArray(
          response?.data?.assets,
        )
          ? response.data.assets
          : [];

        setAssets(nextAssets);

        if (nextAssets.length) {
          /*
           * FIX:
           * Use assetId, not MongoDB _id.
           */
          setSelectedAssetId(
            getAssetId(nextAssets[0]),
          );
        } else {
          setSelectedAssetId("");
        }
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError?.message ||
            "Unable to load drainage assets.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [selectedAreaId]);

  /* =========================================================
     SYNC FORM WITH SELECTED ASSET
  ========================================================= */

  useEffect(() => {
    const asset = assets.find(
      (item) =>
        getAssetId(item) ===
        selectedAssetId,
    );

    if (!asset) return;

    setForm({
      blockagePercent:
        Number(
          asset.blockagePercent ?? 0,
        ),

      capacityUtilizationPercent:
        Number(
          asset.capacityUtilizationPercent ??
            0,
        ),

      condition:
        asset.condition ?? "good",

      status:
        asset.status ?? "operational",
    });

    setStep("edit");
  }, [selectedAssetId, assets]);

  /* =========================================================
     UPDATE FORM
  ========================================================= */

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setSuccess("");
    setError("");
  };

  /* =========================================================
     PREVIEW
  ========================================================= */

  const submit = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setStep("confirm");
  };

  /* =========================================================
     PUBLISH TO MONGODB
  ========================================================= */

  const publish = async () => {
    const token =
      localStorage.getItem(
        "flowshield_official_token",
      );

    if (!token) {
      setError(
        "Official session token is missing. Please sign in again.",
      );

      return;
    }

    if (!selectedAssetId) {
      setError(
        "Please select a drainage asset.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * IMPORTANT:
       * selectedAssetId is now the custom assetId,
       * which matches the backend service.
       */
      const updated =
        await updateDrainageAsset(
          selectedAssetId,
          {
            blockagePercent:
              Number(
                form.blockagePercent,
              ),

            capacityUtilizationPercent:
              Number(
                form.capacityUtilizationPercent,
              ),

            condition:
              form.condition,

            status:
              form.status,

            lastInspectedAt:
              new Date().toISOString(),
          },
          token,
        );

      const updatedAsset =
        updated?.data ?? updated;

      /*
       * Update local UI using assetId.
       */
      setAssets((current) =>
        current.map((asset) =>
          getAssetId(asset) ===
          selectedAssetId
            ? {
                ...asset,
                ...updatedAsset,
              }
            : asset,
        ),
      );

      setStep("success");

      setSuccess(
        "Drainage asset update published to MongoDB.",
      );
    } catch (requestError) {
      console.error(
        "Official drainage update error:",
        requestError,
      );

      if (
        requestError?.message?.includes(
          "401",
        )
      ) {
        setError(
          "Your official session has expired. Please sign in again.",
        );
      } else {
        setError(
          requestError?.message ||
            "Unable to publish the drainage update.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CURRENT ASSET
  ========================================================= */

  const selectedAsset =
    assets.find(
      (asset) =>
        getAssetId(asset) ===
        selectedAssetId,
    ) || null;

  /* =========================================================
     RENDER LOADING
  ========================================================= */

  if (loading && !areas.length) {
    return (
      <div className="page">
        <PageHeading
          eyebrow="Authorized access"
          title="Official portal"
          subtitle="Loading the authorized operational workspace."
          action={
            <div className="risk-chip low">
              <ShieldCheck size={12} />
              Authorized session
            </div>
          }
        />

        <div className="panel">
          <div className="loading-state">
            <div className="loading-block">
              <div className="skeleton large" />
              <div className="skeleton" />
              <div className="skeleton" />

              <div className="loading-caption">
                Loading live drainage records…
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page">
      <PageHeading
        eyebrow="Authorized access"
        title="Official portal"
        subtitle="Publish verified drainage asset conditions. Every change is previewed before it is written to the operational database."
        action={
          <div className="risk-chip low">
            <ShieldCheck size={12} />
            Authorized session
          </div>
        }
      />

      <div className="official-layout">
        <section className="panel official-form">
          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (
            <div className="success-banner">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="recommendation"
              style={{
                marginBottom: 16,
              }}
            >
              <strong>
                Update failed
              </strong>

              <p>{error}</p>
            </div>
          )}

          {/* =================================================
              CONFIRMATION
          ================================================= */}

          {step === "confirm" && (
            <div className="confirm-card">
              <strong>
                Review before publishing
              </strong>

              <p>
                You are about to update{" "}
                <b>
                  {selectedAsset?.name ||
                    selectedAsset?.assetId}
                </b>{" "}
                with the following operational
                values:
              </p>

              <div
                className="result-grid"
                style={{
                  marginTop: 12,
                }}
              >
                <div className="mini-factor">
                  <span>Blockage</span>

                  <strong>
                    {form.blockagePercent}%
                  </strong>
                </div>

                <div className="mini-factor">
                  <span>Capacity use</span>

                  <strong>
                    {
                      form.capacityUtilizationPercent
                    }
                    %
                  </strong>
                </div>

                <div className="mini-factor">
                  <span>Condition</span>

                  <strong>
                    {formatAssetStatus(
                      form.condition,
                    )}
                  </strong>
                </div>

                <div className="mini-factor">
                  <span>Status</span>

                  <strong>
                    {formatAssetStatus(
                      form.status,
                    )}
                  </strong>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="button button-primary button-small"
                  type="button"
                  onClick={publish}
                  disabled={saving}
                  data-testid="button-confirm-publish"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={13}
                        className="spin"
                      />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Confirm & publish
                    </>
                  )}
                </button>

                <button
                  className="button button-quiet button-small"
                  type="button"
                  onClick={() =>
                    setStep("edit")
                  }
                  disabled={saving}
                  data-testid="button-edit-update"
                >
                  <X size={13} />
                  Go back
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              EDIT FORM
          ================================================= */}

          {step !== "confirm" && (
            <form onSubmit={submit}>
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">
                    New official update
                  </div>

                  <h2>
                    Update drainage status
                  </h2>
                </div>

                <ClipboardCheck
                  size={20}
                  color="var(--orange)"
                />
              </div>

              <div className="form-grid">
                {/* AREA */}

                <div className="field">
                  <label htmlFor="official-area">
                    Area
                  </label>

                  <select
                    id="official-area"
                    className="select"
                    value={selectedAreaId}
                    onChange={(event) =>
                      setSelectedAreaId(
                        event.target.value,
                      )
                    }
                    data-testid="select-official-area"
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
                </div>

                {/* ASSET */}

                <div className="field">
                  <label htmlFor="official-asset">
                    Drainage asset
                  </label>

                  <select
                    id="official-asset"
                    className="select"
                    value={selectedAssetId}
                    onChange={(event) =>
                      setSelectedAssetId(
                        event.target.value,
                      )
                    }
                    data-testid="select-official-asset"
                  >
                    {assets.map(
                      (asset) => (
                        <option
                          key={getAssetId(
                            asset,
                          )}
                          value={getAssetId(
                            asset,
                          )}
                        >
                          {asset?.name ||
                            asset?.assetId}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* BLOCKAGE */}

                <div className="field">
                  <label htmlFor="official-blockage">
                    Blockage %
                  </label>

                  <input
                    id="official-blockage"
                    className="text-input"
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.blockagePercent
                    }
                    onChange={(event) =>
                      update(
                        "blockagePercent",
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    required
                  />
                </div>

                {/* CAPACITY */}

                <div className="field">
                  <label htmlFor="official-capacity">
                    Capacity utilization %
                  </label>

                  <input
                    id="official-capacity"
                    className="text-input"
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.capacityUtilizationPercent
                    }
                    onChange={(event) =>
                      update(
                        "capacityUtilizationPercent",
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    required
                  />
                </div>

                {/* CONDITION */}

                <div className="field">
                  <label htmlFor="official-condition">
                    Condition
                  </label>

                  <select
                    id="official-condition"
                    className="select"
                    value={
                      form.condition
                    }
                    onChange={(event) =>
                      update(
                        "condition",
                        event.target.value,
                      )
                    }
                  >
                    <option value="excellent">
                      Excellent
                    </option>

                    <option value="good">
                      Good
                    </option>

                    <option value="fair">
                      Fair
                    </option>

                    <option value="poor">
                      Poor
                    </option>

                    <option value="critical">
                      Critical
                    </option>
                  </select>
                </div>

                {/* STATUS */}

                <div className="field">
                  <label htmlFor="official-status">
                    Operational status
                  </label>

                  <select
                    id="official-status"
                    className="select"
                    value={form.status}
                    onChange={(event) =>
                      update(
                        "status",
                        event.target.value,
                      )
                    }
                  >
                    <option value="operational">
                      Operational
                    </option>

                    <option value="partially_blocked">
                      Partially blocked
                    </option>

                    <option value="blocked">
                      Blocked
                    </option>

                    <option value="failed">
                      Failed
                    </option>

                    <option value="under_maintenance">
                      Under maintenance
                    </option>
                  </select>
                </div>

                {/* REVIEW CHECKBOX */}

                <label className="check-row full">
                  <input
                    type="checkbox"
                    required
                    data-testid="checkbox-official-review"
                  />

                  I have reviewed the latest field
                  status for this drainage asset.
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={!selectedAsset}
                  data-testid="button-preview-update"
                >
                  <FileCheck2 size={14} />
                  Preview official update
                </button>

                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => {
                    if (selectedAsset) {
                      setForm({
                        blockagePercent:
                          Number(
                            selectedAsset.blockagePercent ??
                              0,
                          ),

                        capacityUtilizationPercent:
                          Number(
                            selectedAsset.capacityUtilizationPercent ??
                              0,
                          ),

                        condition:
                          selectedAsset.condition ??
                          "good",

                        status:
                          selectedAsset.status ??
                          "operational",
                      });
                    }

                    setStep("edit");
                    setError("");
                    setSuccess("");
                  }}
                  data-testid="button-reset-official"
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ===================================================
            CURRENT RECORD
        =================================================== */}

        <aside className="panel audit-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                Operational record
              </div>

              <h2>Current asset state</h2>
            </div>

            <ClipboardCheck
              size={18}
              color="var(--teal)"
            />
          </div>

          {selectedAsset ? (
            <div className="audit-list">
              <div className="audit-item">
                <i className="audit-dot" />

                <div>
                  <strong>
                    {selectedAsset.name ||
                      selectedAsset.assetId}
                  </strong>

                  <span>
                    {selectedAsset.assetType ||
                      "Drainage asset"}
                  </span>
                </div>
              </div>

              <div className="audit-item">
                <i className="audit-dot" />

                <div>
                  <strong>
                    Blockage:{" "}
                    {
                      selectedAsset.blockagePercent
                    }
                    %
                  </strong>

                  <span>
                    Capacity utilization:{" "}
                    {
                      selectedAsset.capacityUtilizationPercent
                    }
                    %
                  </span>
                </div>
              </div>

              <div className="audit-item">
                <i className="audit-dot" />

                <div>
                  <strong>
                    Condition:{" "}
                    {formatAssetStatus(
                      selectedAsset.condition,
                    )}
                  </strong>

                  <span>
                    Status:{" "}
                    {formatAssetStatus(
                      selectedAsset.status,
                    )}
                  </span>
                </div>
              </div>

              <div className="audit-item">
                <i className="audit-dot" />

                <div>
                  <strong>
                    Last inspection
                  </strong>

                  <span>
                    {formatTime(
                      selectedAsset.lastInspectedAt,
                    )}
                  </span>
                </div>
              </div>

              <div className="audit-item">
                <i className="audit-dot" />

                <div>
                  <strong>
                    Last database update
                  </strong>

                  <span>
                    {formatTime(
                      selectedAsset.lastUpdatedAt ??
                        selectedAsset.updatedAt,
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-detail-empty">
              No drainage assets are currently stored
              for this area.
            </div>
          )}

          <div
            className="recommendation"
            style={{
              marginTop: 16,
              background: "var(--teal-pale)",
              borderColor: "#acd6c8",
            }}
          >
            <strong
              style={{
                color: "var(--teal)",
              }}
            >
              Authority scope
            </strong>

            <p>
              {officialUser?.department ||
                "Authorized officials"}{" "}
              · Drainage asset status updates
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}