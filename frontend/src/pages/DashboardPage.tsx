import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Card, Button, Badge, LoadingSpinner } from '@/components/common';
import { certificateService, verificationService } from '@/services';
import { CertificateStats, VerificationStats } from '@/types';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [certStats, setCertStats] = useState<CertificateStats | null>(null);
  const [verifyStats, setVerifyStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [certs, verifications] = await Promise.all([
        certificateService.getStats(),
        verificationService.getStats(),
      ]);
      setCertStats(certs);
      setVerifyStats(verifications);
    } catch (error: any) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Link to="/certificates/upload">
            <Button>Upload Certificate</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-3xl font-bold text-gray-900">{certStats?.total || 0}</p>
              </div>
              <Badge variant="info">All</Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-3xl font-bold text-success-600">{certStats?.verified || 0}</p>
              </div>
              <Badge variant="success">Success</Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-warning-600">{certStats?.pending || 0}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-3xl font-bold text-danger-600">{certStats?.unverified || 0}</p>
              </div>
              <Badge variant="danger">Failed</Badge>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Verification Statistics">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Verifications</span>
                <span className="font-semibold">{verifyStats?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-success-600">{verifyStats?.completed || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Confidence</span>
                <span className="font-semibold">{verifyStats?.averageConfidence?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link to="/certificates/upload" className="block">
                <Button className="w-full" variant="primary">Upload New Certificate</Button>
              </Link>
              <Link to="/certificates" className="block">
                <Button className="w-full" variant="secondary">View All Certificates</Button>
              </Link>
              <Link to="/verifications" className="block">
                <Button className="w-full" variant="secondary">View Verifications</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};