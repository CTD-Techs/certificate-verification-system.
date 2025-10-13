import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { StatsCard } from '@/components/admin';
import { Card, LoadingSpinner } from '@/components/common';
import { adminService } from '@/services';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export const AdminStatsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await adminService.getRecentActivities();
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  if (isLoading && !stats) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Statistics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of system performance and metrics
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers || 0}
              trend={stats.usersTrend}
              icon="users"
            />
            <StatsCard
              title="Total Certificates"
              value={stats.totalCertificates || 0}
              trend={stats.certificatesTrend}
              icon="certificate"
            />
            <StatsCard
              title="Total Verifications"
              value={stats.totalVerifications || 0}
              trend={stats.verificationsTrend}
              icon="check"
            />
            <StatsCard
              title="Success Rate"
              value={`${stats.successRate || 0}%`}
              trend={stats.successRateTrend}
              icon="chart"
            />
          </div>
        )}

        {/* Verification Status Breakdown */}
        {stats?.verificationBreakdown && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {stats.verificationBreakdown.verified || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Verified</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {stats.verificationBreakdown.unverified || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Unverified</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.verificationBreakdown.pending || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.verificationBreakdown.manualReview || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Manual Review</p>
              </div>
            </div>
          </Card>
        )}

        {/* User Role Distribution */}
        {stats?.userRoles && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">API Users</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.userRoles.API_USER || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Verifiers</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.userRoles.VERIFIER || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Admins</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.userRoles.ADMIN || 0}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 10).map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.user?.email || 'System'} • {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* System Health */}
        {stats?.systemHealth && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      stats.systemHealth.database === 'healthy'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {stats.systemHealth.database}
                </p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      stats.systemHealth.api === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">API</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{stats.systemHealth.api}</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      stats.systemHealth.storage === 'healthy'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">Storage</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {stats.systemHealth.storage}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};