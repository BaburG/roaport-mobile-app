import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { EventSubscription } from "expo-modules-core";
// import { registerForPushNotificationsAsync } from "@/src/utils/registerForPushNotificationsAsync";
import { usePushTokenService } from "@/src/services/notifications/pushTokenService";
import { useAuth } from "@/src/context/AuthContext";
import Toast from "react-native-toast-message";

interface NotificationContextType {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined
);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error(
            "useNotification must be used within a NotificationProvider"
        );
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
    children,
}) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] =
        useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const { registerPushToken } = usePushTokenService();
    const { isAuthenticated } = useAuth();

    const notificationListener = useRef<EventSubscription | null>(null);
    const responseListener = useRef<EventSubscription | null>(null);

    // First effect: Get push token
    useEffect(() => {
        // registerForPushNotificationsAsync().then(
        //     (token) => {
        //         setExpoPushToken(token);
        //     },
        //     (error) => setError(error)
        // );

        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log("🔔 Notification Received while the app is running: ", notification);
                setNotification(notification);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener((response) => {
                console.log(
                    "🔔 Notification Response: ",
                    JSON.stringify(response, null, 2),
                    JSON.stringify(response.notification.request.content.data, null, 2)
                );
                // Handle the notification response here
            });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(
                    notificationListener.current
                );
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    // Second effect: Register push token with backend when we have both token and auth state
    useEffect(() => {
        if (expoPushToken && isAuthenticated !== null) {
            registerPushToken(expoPushToken).catch((error) => {
                console.error('Failed to register push token:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Failed to register push notifications',
                    text2: 'Please try again later',
                });
            });
        }
    }, [expoPushToken, isAuthenticated, registerPushToken]);

    return (
        <NotificationContext.Provider
            value={{ expoPushToken, notification, error }}
        >
            {children}
        </NotificationContext.Provider>
    );
};