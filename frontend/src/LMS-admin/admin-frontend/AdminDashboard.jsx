/**
 * AdminDashboard - Main admin dashboard page.
 *
 * ============================================================================
 * ORIGINAL BLADE (resources/views/admin/dashboard/index.blade.php):
 * ============================================================================
 * @extends('layouts.admin')
 * @push('title', get_phrase('Dashboard'))
 * @section('content')
 *   <!-- Dashboard header card -->
 *   <!-- Stat cards row: courses, lessons, enrollments, students, instructors -->
 *   <div class="row">
 *     <canvas id="myChart"></canvas>  <!-- Admin revenue line chart -->
 *   </div>
 *   <div class="row">
 *     <canvas id="pie2"></canvas>  <!-- Course status pie chart -->
 *     <table>... pending payouts ...</table>
 *   </div>
 * @endsection
 *
 * Stats came from inline PHP queries (App\Models\Course::count(), etc.).
 * Charts used Chart.js loaded via @push('js') with embedded JSON data.
 * ============================================================================
 *
 * Conversion notes:
 * - Inline DB queries are replaced with a /api/admin/dashboard/stats call
 * - Chart.js is replaced with react-chartjs-2 (declarative wrapper)
 * - currency() helper is replaced with formatCurrency() from settings context
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES } from '@/config/routes';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_COLORS = ['#12c093', '#169f48', '#ff2583', '#000', '#878d97', '#dadada'];
const STATUS_LABELS = ['Active', 'Upcoming', 'Pending', 'Private', 'Draft', 'Inactive'];

const STAT_ICONS = [
  { icon: 'fi-rr-e-learning', tint: 'bg-emerald-50 text-emerald-600' },
  { icon: 'fi-rr-book-alt', tint: 'bg-sky-50 text-sky-600' },
  { icon: 'fi-rr-graduation-cap', tint: 'bg-amber-50 text-amber-600' },
  { icon: 'fi-rr-users', tint: 'bg-rose-50 text-rose-600' },
  { icon: 'fi-rr-user', tint: 'bg-indigo-50 text-indigo-600' },
];

export default function AdminDashboard() {
  const { get, loading, error } = useApi();
  const { translate, formatCurrency } = useSettings();

  const [stats, setStats] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [courseStatus, setCourseStatus] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [statsData, revenueData, statusData, payoutsData] = await Promise.all([
          get(API.ADMIN_DASHBOARD_STATS),
          get(API.ADMIN_DASHBOARD_REVENUE),
          get(API.ADMIN_DASHBOARD_COURSE_STATUS),
          get(API.ADMIN_DASHBOARD_PAYOUTS),
        ]);

        if (cancelled) return;
        setStats(statsData);
        setMonthlyRevenue(revenueData.monthly_amount || []);
        setCourseStatus(statusData.statuses || []);
        setPendingPayouts(payoutsData.payouts || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [get]);

  if (loading && !stats) return <LoadingSpinner />;

  const lineChartData = {
    labels: MONTHS,
    datasets: [
      {
        label: translate('Admin revenue'),
        fill: true,
        tension: 0.35,
        backgroundColor: 'rgba(16,185,129,0.12)',
        borderColor: 'rgb(16,185,129)',
        pointBackgroundColor: 'rgb(16,185,129)',
        pointBorderColor: '#fff',
        pointRadius: 3,
        pointHoverRadius: 5,
        data: monthlyRevenue,
      },
    ],
  };

  const lineChartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } },
      y: {
        grid: { color: '#f3f4f6', drawBorder: false },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
    },
  };

  const doughnutChartData = {
    labels: STATUS_LABELS.map((l) => translate(l)),
    datasets: [
      {
        backgroundColor: STATUS_COLORS,
        label: translate('Courses'),
        data: courseStatus,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  const statCards = [
    { value: stats?.courses, label: translate('Number of Courses') },
    { value: stats?.lessons, label: translate('Number of Lessons') },
    { value: stats?.enrollments, label: translate('Number of Enrollment') },
    { value: stats?.students, label: translate('Number of Students') },
    { value: stats?.instructors, label: translate('Number of Instructor') },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <i className="fi-rr-settings-sliders text-emerald-600" />
          {translate('Dashboard')}
        </h4>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const meta = STAT_ICONS[idx] || STAT_ICONS[0];
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.tint}`}>
                <i className={`${meta.icon} text-lg`} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">{card.value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {translate('Admin Revenue This Year')}
          </h2>
          <Link
            className="text-xs text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            to={ROUTES.ADMIN_REVENUE}
            title={translate('Admin Revenue')}
          >
            <span>{translate('View')}</span>
            <i className="fi-rr-arrow-alt-right text-[10px]" />
          </Link>
        </div>
        <div style={{ height: '320px' }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Course status + Pending payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">{translate('Course Status')}</h4>
            <Link
              className="text-xs text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              to={ROUTES.ADMIN_COURSES}
              title={translate('Explore Courses')}
            >
              <span>{translate('View')}</span>
              <i className="fi-rr-arrow-alt-right text-[10px]" />
            </Link>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <div style={{ width: 160, height: 160 }}>
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            </div>
            <ul className="space-y-2">
              {STATUS_LABELS.map((label, idx) => (
                <li key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: STATUS_COLORS[idx] }}
                  />
                  <span>{translate(label)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">
              {translate('Pending Requested withdrawal')}
            </h4>
            <Link
              className="text-xs text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              to={ROUTES.ADMIN_INSTRUCTOR_PAYOUT}
              title={translate('Instructor Payout')}
            >
              <span>{translate('View')}</span>
              <i className="fi-rr-arrow-alt-right text-[10px]" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {pendingPayouts.length === 0 ? (
              <NoData message={translate('No pending payouts')} />
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {pendingPayouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="py-3">
                        <p className="font-medium text-gray-900">
                          {translate('Name')}: {payout.user?.name}
                        </p>
                        <small className="text-gray-500">
                          {translate('Email')}: {payout.user?.email}
                        </small>
                      </td>
                      <td className="py-3 text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(payout.amount)}
                        </p>
                        <small className="text-gray-500">
                          {translate('Requested withdrawal amount')}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
