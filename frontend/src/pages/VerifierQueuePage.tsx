import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ReviewQueue } from '@/components/verifier';
import { Card, LoadingSpinner } from '@/components/common';
import { verifierService } from '@/services';
import { ReviewStats } from '@/types';
import toast from 'react-hot-toast';

export const VerifierQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchReviews(), fetchStats()]);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await verifierService.getQueue();
      setReviews(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to fetch reviews');
      throw error;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await verifierService.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to fetch statistics');
      throw error;
    }
  };

  const handleAssignToMe = async (reviewId: string) => {
    try {
      // Get current user ID from auth store or use a placeholder
      const verifierId = 'current-user-id'; // This should come from auth context/store
      await verifierService.assignReview(reviewId, { verifierId });
      toast.success('Review assigned to you!');
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to assign review');
    }
  };

  const handleReviewClick = (review: any) => {
    navigate(`/verifier/review/${review.id}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pending certificate verifications requiring manual review
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned to Me</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.assigned || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.inProgress || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Review Queue */}
        <ReviewQueue
          reviews={reviews}
          onAssignToMe={handleAssignToMe}
          onReviewClick={handleReviewClick}
        />
      </div>
    </Layout>
  );
};