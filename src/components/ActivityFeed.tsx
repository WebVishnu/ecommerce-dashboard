import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Trash2,
  Package,
  Users,
  Cat,
  ShoppingCart
} from 'lucide-react';
import { useDashboardStore } from '../store';
import { Link } from 'react-router-dom';

export default function ActivityFeed() {
  const { recentActions } = useDashboardStore();

  const getActionIcon = (type: string, entityType: string) => {
    // First determine the entity icon
    const entityIcon = () => {
      switch (entityType) {
        case 'products':
          return <Package className="h-5 w-5" />;
        case 'customers':
          return <Users className="h-5 w-5" />;
        case 'categories':
          return <Cat className="h-5 w-5" />;
        case 'orders':
          return <ShoppingCart className="h-5 w-5" />;
        default:
          return null;
      }
    };

    // Then determine the action style
    const actionStyle = () => {
      switch (type) {
        case 'insert':
          return 'bg-green-100 text-green-600';
        case 'update':
          return 'bg-blue-100 text-blue-600';
        case 'delete':
          return 'bg-red-100 text-red-600';
        default:
          return 'bg-gray-100 text-gray-600';
      }
    };

    return (
      <div className={`p-2 rounded-lg ${actionStyle()}`}>
        {entityIcon()}
      </div>
    );
  };

  const getActionLink = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'products':
        return `/products/${entityId}`;
      case 'customers':
        return `/customers/${entityId}`;
      case 'categories':
        return '/categories';
      case 'orders':
        return `/orders/${entityId}`;
      default:
        return '#';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-6">
          {recentActions.map((action) => (
            <div key={action.id} className="flex items-start gap-4">
              {getActionIcon(action.action_type, action.entity_type)}
              <div className="flex-1 min-w-0">
                <Link 
                  to={getActionLink(action.entity_type, action.entity_id)}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {action.description}
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatTime(action.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}