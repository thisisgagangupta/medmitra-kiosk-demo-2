import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, RefreshCw, Eye, ArrowUp, ArrowDown } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { MockQueueService, MockToken } from "@/lib/mock-services";

interface QueuePosition {
  position: number;
  eta: string;
}

export default function QueuePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  
  const [userToken, setUserToken] = useState<MockToken | null>(null);
  const [userPosition, setUserPosition] = useState<QueuePosition>({ position: 0, eta: 'Now!' });
  const [currentQueue, setCurrentQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load user's token from storage
  useEffect(() => {
    const storedToken = localStorage.getItem('medmitra-token');
    if (storedToken) {
      setUserToken(JSON.parse(storedToken));
    }
  }, []);

  // Subscribe to queue updates for user's token
  useEffect(() => {
    if (!userToken) return;

    const unsubscribe = MockQueueService.subscribe(
      userToken.id,
      (position: number, eta: string) => {
        setUserPosition({ position, eta });
        setLastUpdated(new Date());
      }
    );

    return unsubscribe;
  }, [userToken]);

  // Load current queue status
  const loadQueue = async () => {
    setLoading(true);
    try {
      const queue = await MockQueueService.getCurrentQueue();
      setCurrentQueue(queue);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Now': return 'bg-success text-success-foreground';
      case 'Next': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPositionTrend = () => {
    // Mock trend calculation
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    return trend;
  };

  if (!userToken) {
    return (
      <KioskLayout title="Queue Status">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">No Active Token</h2>
            <p className="text-muted-foreground mb-6">
              You don't have an active token. Please check-in first to view your queue status.
            </p>
            <Button onClick={() => navigate('/start')} size="lg">
              Start Check-in Process
            </Button>
          </Card>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout title="Live Queue Status">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Users className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            Live Queue Status
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time updates on your queue position and wait time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User's Position */}
          <Card className="lg:col-span-1 p-6 shadow-kiosk">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-4">Your Position</h2>
              
              <div className="mb-6">
                <div className="text-5xl font-bold text-primary mb-2">
                  {userToken.number}
                </div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  Token Number
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Queue Position</span>
                    <div className="flex items-center gap-1">
                      {getPositionTrend() === 'up' ? (
                        <ArrowUp className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold">
                    {userPosition.position === 0 ? 'Next!' : userPosition.position}
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Estimated Time</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {userPosition.eta}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  onClick={loadQueue}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              </div>
            </div>
          </Card>

          {/* Current Queue */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Current Queue</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

          <div className="space-y-3">
            {currentQueue.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  item.tokenNumber === userToken.number
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-foreground">
                    {item.tokenNumber}
                  </div>
                  {item.tokenNumber === userToken.number && (
                    <Badge variant="default" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {item.estimatedTime}
                  </span>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {currentQueue.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No queue data available</p>
            </div>
          )}
        </Card>
        </div>

        {/* Queue Statistics */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Queue Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {currentQueue.length}
              </div>
              <p className="text-sm text-muted-foreground">Total in Queue</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">
                ~{Math.floor(Math.random() * 5) + 3} min
              </div>
              <p className="text-sm text-muted-foreground">Avg Wait Time</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {Math.floor(Math.random() * 3) + 1}
              </div>
              <p className="text-sm text-muted-foreground">Doctors Available</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate('/token')}
            variant="outline"
            size="lg"
            className="text-lg py-4 h-auto"
          >
            <Eye className="h-5 w-5 mr-2" />
            View My Token
          </Button>
          
          <Button
            onClick={() => navigate('/lab')}
            variant="outline"
            size="lg"
            className="text-lg py-4 h-auto"
          >
            Lab Services
          </Button>
          
          <Button
            onClick={() => navigate('/help')}
            variant="outline"
            size="lg"
            className="text-lg py-4 h-auto"
          >
            Need Help?
          </Button>
        </div>

        {/* Privacy Notice */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Privacy Notice:</strong> Queue displays show token numbers only, not personal information. 
            All data is anonymized for patient privacy protection.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}