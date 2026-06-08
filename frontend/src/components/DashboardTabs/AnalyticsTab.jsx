/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import DashboardCards from "../DashboardCards";
import PipelineFunnel from "../PipelineFunnel";
import { Activity, FolderOpen, Zap, Clock, CheckCircle2, AlertTriangle, TrendingUp, Users, Calendar, GitBranch, AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";


const AnalyticsTab = ({ ctx }) => {
  const {
    activeTab,
    activities,
    analyticsData,
    analyticsLoading,
    card,
    cases,
    chartTimeframe,
    completed,
    customEnd,
    customStart,
    delayed,
    deptWidgets,
    inProgress,
    isAdmin,
    isSimulating,
    loading,
    lsSimulating,
    myWidgets,
    navigate,
    onLogout,
    overdue,
    perf,
    pipeline,
    quotations,
    roleBadge,
    setActiveTab,
    setActivities,
    setAnalyticsData,
    setAnalyticsLoading,
    setCases,
    setChartTimeframe,
    setCustomEnd,
    setCustomStart,
    setLoading,
    setOverdue,
    setPerf,
    setPipeline,
    setQuotations,
    setStats,
    setSummary,
    stats,
    summary,
    title,
    total,
    userId,
    userName,
    userRole,
    viewAsRole,
    viewAsUserId,
    viewAsUserName,
  } = ctx;

  return (
    <>
      {/* ── Analytics Tab (Admin only) ────────────────────────────────── */}
        {isAdmin && !isSimulating && activeTab === "analytics" && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              marginBottom: "28px",
            }}
          >
            {analyticsLoading ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid var(--surface-3)",
                    borderTopColor: "var(--color-primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 16px",
                  }}
                />
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-3)",
                  }}
                >
                  Analyzing data…
                </p>
              </div>
            ) : (
              <>
                {/* ── Revenue Pipeline Metrics ── */}
                {analyticsData.revenuePipeline &&
                  (() => {
                    const rp = analyticsData.revenuePipeline;
                    const fmt = (n) =>
                      n >= 10000000
                        ? `₹${(n / 10000000).toFixed(2)}Cr`
                        : n >= 100000
                          ? `₹${(n / 100000).toFixed(1)}L`
                          : `₹${(n / 1000).toFixed(0)}K`;
                    return (
                      <div
                        className="card"
                        style={{
                          padding: "28px",
                          background: "var(--color-surface)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "24px",
                          }}
                        >
                          <div
                            style={{
                              padding: "8px",
                              borderRadius: "10px",
                              background: "var(--color-primary-muted)",
                            }}
                          >
                            <Zap
                              style={{
                                width: "20px",
                                height: "20px",
                                color: "var(--color-primary)",
                              }}
                            />
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "var(--text-1)",
                                letterSpacing: "-0.02em",
                                margin: 0,
                              }}
                            >
                              Revenue Pipeline
                            </h3>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "var(--text-4)",
                                marginTop: "2px",
                              }}
                            >
                              Aggregated financial metrics for all active
                              projects
                            </p>
                          </div>
                        </div>
                        <div
                          className="dash-cards-grid"
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "16px",
                          }}
                        >
                          {[
                            {
                              label: "Total Pipeline",
                              val: fmt(rp.totalPipelineValue || 0),
                              icon: TrendingUp,
                              color: "var(--color-primary)",
                              bg: "var(--color-primary-light)",
                            },
                            {
                              label: "Loan Cases",
                              val: `${rp.loanCases || 0}`,
                              sub: "cases",
                              icon: GitBranch,
                              color: "var(--color-purple)",
                              bg: "var(--color-purple-light)",
                            },
                            {
                              label: "Cash Cases",
                              val: `${rp.cashCases || 0}`,
                              sub: "cases",
                              icon: CheckCircle2,
                              color: "var(--color-accent)",
                              bg: "var(--color-accent-light)",
                            },
                            {
                              label: "Avg Loan Amount",
                              val: fmt(rp.avgLoan || 0),
                              icon: Activity,
                              color: "var(--color-warning)",
                              bg: "var(--color-warning-light)",
                            },
                            {
                              label: "Down Payments",
                              val: fmt(rp.totalDown || 0),
                              icon: FolderOpen,
                              color: "var(--color-info)",
                              bg: "var(--color-info-light)",
                            },
                            {
                              label: "Active Cases",
                              val: `${rp.activeCases || 0}`,
                              icon: Users,
                              color: "var(--text-3)",
                              bg: "var(--surface-2)",
                            },
                          ].map(
                            ({ label, val, sub, icon: Icon, color, bg }, i) => (
                              <div
                                key={label}
                                className="card-lift"
                                style={{
                                  background: bg,
                                  border: `1px solid ${color}22`,
                                  borderRadius: "16px",
                                  padding: "20px",
                                  transition: "all 0.3s ease",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "16px",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      color,
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    {label}
                                  </p>
                                  <Icon
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      color,
                                      opacity: 0.7,
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: "4px",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "28px",
                                      fontWeight: 800,
                                      color,
                                      letterSpacing: "-0.03em",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {val}
                                  </p>
                                  {sub && (
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        color,
                                        fontWeight: 600,
                                        opacity: 0.8,
                                      }}
                                    >
                                      {sub}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    position: "absolute",
                                    right: "-10px",
                                    bottom: "-10px",
                                    opacity: 0.05,
                                    transform: "scale(2.5)",
                                  }}
                                >
                                  <Icon
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      color,
                                    }}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })()}

                <div
                  className="analytics-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "24px",
                    alignItems: "stretch",
                  }}
                >
                  {/* ── Trend Chart ── */}
                  <div
                    className="card"
                    style={{
                      padding: "28px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px",
                            borderRadius: "10px",
                            background: "var(--surface-2)",
                          }}
                        >
                          <Activity
                            style={{
                              width: "20px",
                              height: "20px",
                              color: "var(--text-1)",
                            }}
                          />
                        </div>
                        <div>
                          <h3
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "var(--text-1)",
                              letterSpacing: "-0.02em",
                              margin: 0,
                            }}
                          >
                            Registration Trends
                          </h3>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-4)",
                              marginTop: "2px",
                            }}
                          >
                            Case volume over time
                          </p>
                        </div>
                      </div>

                      {/* Timeframe Filters */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {["daily", "weekly", "monthly", "yearly", "custom"].map(
                          (tf) => (
                            <button
                              key={tf}
                              onClick={() => setChartTimeframe(tf)}
                              style={{
                                background:
                                  chartTimeframe === tf
                                    ? "var(--color-primary)"
                                    : "var(--surface-2)",
                                color:
                                  chartTimeframe === tf
                                    ? "#fff"
                                    : "var(--text-2)",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                textTransform: "capitalize",
                                transition: "all 0.2s",
                              }}
                            >
                              {tf}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {chartTimeframe === "custom" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginBottom: "24px",
                          alignItems: "center",
                          background: "var(--surface-2)",
                          padding: "12px",
                          borderRadius: "12px",
                        }}
                      >
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            background: "var(--surface-1)",
                          }}
                        />
                        <span
                          style={{ fontSize: "12px", color: "var(--text-3)" }}
                        >
                          to
                        </span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            background: "var(--surface-1)",
                          }}
                        />
                      </div>
                    )}

                    {(() => {
                      const trend = analyticsData.trendData || [];
                      if (trend.length === 0 && !analyticsLoading)
                        return (
                          <p
                            style={{
                              fontSize: "14px",
                              color: "var(--text-4)",
                              textAlign: "center",
                              padding: "40px",
                              flex: 1,
                            }}
                          >
                            No registration data available for this period.
                          </p>
                        );

                      return (
                        <div
                          style={{
                            flex: 1,
                            minHeight: "300px",
                            position: "relative",
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={trend}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorCount"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0.4}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "var(--text-3)" }}
                                dy={10}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "var(--text-3)" }}
                              />
                              <CartesianGrid
                                vertical={false}
                                stroke="var(--border)"
                                strokeDasharray="3 3"
                                opacity={0.5}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--color-surface)",
                                  borderColor: "var(--border)",
                                  borderRadius: "8px",
                                  boxShadow: "var(--shadow-card)",
                                  padding: "12px",
                                }}
                                itemStyle={{
                                  color: "var(--text-1)",
                                  fontWeight: 700,
                                }}
                                labelStyle={{
                                  color: "var(--text-3)",
                                  fontSize: "13px",
                                  marginBottom: "4px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke="var(--color-primary)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                animationDuration={800}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Escalation Breakdown ── */}
                  {(() => {
                    const escalated = cases.filter(
                      (c) => (c.escalation_level || 0) > 0,
                    );
                    const byCritical = cases.filter(
                      (c) => c.escalation_level === 3,
                    ).length;
                    const byUrgent = cases.filter(
                      (c) => c.escalation_level === 2,
                    ).length;
                    const byWatch = cases.filter(
                      (c) => c.escalation_level === 1,
                    ).length;
                    return (
                      <div
                        className="card"
                        style={{
                          padding: "28px",
                          background: "var(--color-surface)",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "24px",
                          }}
                        >
                          <div
                            style={{
                              padding: "8px",
                              borderRadius: "10px",
                              background: "var(--color-danger-muted)",
                            }}
                          >
                            <AlertTriangle
                              style={{
                                width: "20px",
                                height: "20px",
                                color: "var(--color-danger)",
                              }}
                            />
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "var(--text-1)",
                                letterSpacing: "-0.02em",
                                margin: 0,
                              }}
                            >
                              Escalations
                            </h3>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "var(--text-4)",
                                marginTop: "2px",
                              }}
                            >
                              {escalated.length} active alerts
                            </p>
                          </div>
                        </div>

                        {escalated.length === 0 ? (
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "var(--surface-2)",
                              borderRadius: "16px",
                              padding: "20px",
                            }}
                          >
                            <CheckCircle2
                              style={{
                                width: "32px",
                                height: "32px",
                                color: "var(--color-accent)",
                                marginBottom: "12px",
                              }}
                            />
                            <p
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-2)",
                              }}
                            >
                              All Clear
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "var(--text-4)",
                                textAlign: "center",
                              }}
                            >
                              No cases require immediate attention.
                            </p>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                              flex: 1,
                              justifyContent: "center",
                            }}
                          >
                            {[
                              {
                                label: "Critical (7+ days)",
                                count: byCritical,
                                color: "var(--color-danger)",
                                bg: "var(--color-danger-muted)",
                              },
                              {
                                label: "Urgent (4-6 days)",
                                count: byUrgent,
                                color: "var(--color-warning)",
                                bg: "var(--color-warning-muted)",
                              },
                              {
                                label: "Watch (2-3 days)",
                                count: byWatch,
                                color: "var(--color-info)",
                                bg: "var(--color-info-light)",
                              },
                            ].map(({ label, count, color, bg }) => (
                              <div
                                key={label}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "16px 20px",
                                  background: "var(--surface-2)",
                                  borderRadius: "12px",
                                  borderLeft: `4px solid ${color}`,
                                }}
                              >
                                <div>
                                  <p
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 700,
                                      color: "var(--text-1)",
                                    }}
                                  >
                                    {label.split(" ")[0]}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--text-4)",
                                    }}
                                  >
                                    {label.substring(label.indexOf(" ") + 1)}
                                  </p>
                                </div>
                                <div
                                  style={{
                                    background: bg,
                                    color,
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "18px",
                                    fontWeight: 800,
                                  }}
                                >
                                  {count}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}
    </>
  );
};

export default AnalyticsTab;
