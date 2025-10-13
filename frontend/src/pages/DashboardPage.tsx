import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Card, Button, Badge, LoadingSpinner } from '@/components/common';
import { certificateService, verificationService } from '@/services';
import { CertificateStats, VerificationStats } from '@/types';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

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

  const statCards = [
    {
      title: 'Total Certificates',
      value: certStats?.total || 0,
      icon: DocumentTextIcon,
      gradient: 'from-blue-500 to-purple-600',
      badge: 'All',
      badgeVariant: 'info' as const,
      delay: '0ms',
    },
    {
      title: 'Verified',
      value: certStats?.verified || 0,
      icon: CheckCircleIcon,
      gradient: 'from-green-500 to-emerald-600',
      badge: 'Success',
      badgeVariant: 'success' as const,
      delay: '100ms',
    },
    {
      title: 'Pending',
      value: certStats?.pending || 0,
      icon: ClockIcon,
      gradient: 'from-yellow-500 to-orange-600',
      badge: 'Pending',
      badgeVariant: 'warning' as const,
      delay: '200ms',
    },
    {
      title: 'Unverified',
      value: certStats?.unverified || 0,
      icon: XCircleIcon,
      gradient: 'from-red-500 to-pink-600',
      badge: 'Failed',
      badgeVariant: 'danger' as const,
      delay: '300ms',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your verification overview.</p>
          </div>
          <Link to="/certificates/upload">
            <Button className="group">
              <SparklesIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Upload Certificate
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="animate-slide-up"
                style={{ animationDelay: stat.delay }}
              >
                <Card hover gradient className="relative overflow-hidden group bg-gray-50 dark:bg-gray-900/50">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-glow transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant={stat.badgeVariant}>{stat.badge}</Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{stat.title}</p>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification Statistics */}
          <div className="animate-slide-up delay-400">
            <Card title="Verification Statistics" gradient>
              <div className="space-y-6">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Total Verifications</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">{verifyStats?.total || 0}</span>
                </div>
                
                <div className="flex justify-between items-center group">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                    <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Completed</span>
                  </div>
                  <span className="font-bold text-xl text-success-400">{verifyStats?.completed || 0}</span>
                </div>
                
                <div className="flex justify-between items-center group">
                  <div className="flex items-center space-x-3">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-secondary-500" />
                    <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Average Confidence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-secondary rounded-full transition-all duration-1000"
                        style={{ width: `${verifyStats?.averageConfidence || 0}%` }}
                      />
                    </div>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">{verifyStats?.averageConfidence?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="animate-slide-up delay-500">
            <Card title="Quick Actions" gradient>
              <div className="space-y-3">
                <Link to="/certificates/upload" className="block group">
                  <Button className="w-full justify-between group-hover:shadow-glow" variant="primary">
                    <span>Upload New Certificate</span>
                    <SparklesIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/certificates" className="block group">
                  <Button className="w-full justify-between" variant="secondary">
                    <span>View All Certificates</span>
                    <DocumentTextIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/verifications" className="block group">
                  <Button className="w-full justify-between" variant="secondary">
                    <span>View Verifications</span>
                    <CheckCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};