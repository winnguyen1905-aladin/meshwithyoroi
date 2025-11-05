'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { 
  Wallet, 
  Briefcase, 
  Shield, 
  Zap, 
  Lock, 
  ArrowRight,
  CheckCircle2,
  Users,
  Globe
} from 'lucide-react';

export default function IntroductionPage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Wallet,
      title: 'Cardano Wallet Integration',
      description: 'Connect and manage your Cardano wallet securely. Support for multiple wallet providers with seamless authentication.',
    },
    {
      icon: Briefcase,
      title: 'Job Management',
      description: 'Create, manage, and track jobs with escrow support. Post jobs with Aladin and Genie stake addresses for secure transactions.',
    },
    {
      icon: Shield,
      title: 'Escrow Services',
      description: 'Secure your transactions with built-in escrow functionality. Create escrow contracts and manage releases safely.',
    },
    {
      icon: Zap,
      title: 'Fast Transactions',
      description: 'Build, sign, and submit Cardano transactions quickly with our streamlined transaction management system.',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'Your communications and data are protected with state-of-the-art encryption for maximum security.',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage your profile, settings, and wallet connections with an intuitive interface.',
    },
  ];

  const benefits = [
    'Secure wallet authentication using Cardano stake addresses',
    'Create and manage job postings with escrow support',
    'Track transaction history and manage payments',
    'End-to-end encrypted communications',
    'Multi-wallet support (Nami, Eternl, Lace, and more)',
    'Real-time transaction status updates',
  ];

  const steps = [
    {
      step: '1',
      title: 'Connect Your Wallet',
      description: 'Choose your Cardano wallet provider and connect securely using stake address authentication.',
    },
    {
      step: '2',
      title: 'Create Your Account',
      description: 'Set up your account with a secure password. Your wallet address becomes your unique identifier.',
    },
    {
      step: '3',
      title: 'Start Creating Jobs',
      description: 'Post jobs with Aladin and Genie addresses, set up escrow contracts, and manage transactions.',
    },
    {
      step: '4',
      title: 'Manage & Track',
      description: 'Monitor your jobs, transactions, and communications all in one place with real-time updates.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Cardano Blockchain Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Aladin Contract
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your secure gateway to Cardano wallet management, job posting, and escrow services. 
            Built on blockchain technology for transparency and trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {!isAuthenticated ? (
              <>
                <Button asChild size="lg" className="text-base px-8">
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link href="/job">Explore Jobs</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="text-base px-8">
                  <Link href="/job">
                    View Jobs
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your Cardano transactions, jobs, and escrow contracts
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Aladin Contract?</h2>
            <p className="text-lg text-muted-foreground">
              Experience the power of blockchain technology with user-friendly tools
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get started in just a few simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                    {step.step}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardContent>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Security First</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Built on Cardano Blockchain</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Aladin Contract leverages the security and transparency of the Cardano blockchain. 
            All transactions are verified on-chain, and your wallet keys never leave your device.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-6 py-3 rounded-lg bg-card border">
              <p className="text-sm text-muted-foreground">Non-Custodial</p>
              <p className="text-lg font-semibold">You Control Your Keys</p>
            </div>
            <div className="px-6 py-3 rounded-lg bg-card border">
              <p className="text-sm text-muted-foreground">On-Chain</p>
              <p className="text-lg font-semibold">Verified Transactions</p>
            </div>
            <div className="px-6 py-3 rounded-lg bg-card border">
              <p className="text-sm text-muted-foreground">Encrypted</p>
              <p className="text-lg font-semibold">E2EE Communications</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join the Aladin Contract platform and start managing your Cardano transactions today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <Button asChild size="lg" className="text-base px-8">
                  <Link href="/login">
                    Connect Your Wallet
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="text-base px-8">
                    <Link href="/job">
                      Create Your First Job
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-base px-8">
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

