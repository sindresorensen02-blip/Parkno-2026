import React, { useEffect, useRef } from 'react';
import { NavigationContainer, TabActions, StackActions, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Must be imported at app root so TaskManager.defineTask runs before any task fires
import './src/tasks/geofenceTask';
import { useProximityAlerts } from './src/hooks/useProximityAlerts';
import { supabase } from './src/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import WelcomeScreen from './src/screens/WelcomeScreen';
import LiveSpotScreen from './src/screens/LiveSpotScreen';
import HostScreen from './src/screens/HostScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RedigerProfilScreen from './src/screens/RedigerProfilScreen';
import BetalingsmetodeScreen from './src/screens/BetalingsmetodeScreen';
import ReservasjonshistorikkScreen from './src/screens/ReservasjonshistorikkScreen';
import VarslerScreen from './src/screens/VarslerScreen';
import PersonvernScreen from './src/screens/PersonvernScreen';
import HjelpFAQScreen from './src/screens/HjelpFAQScreen';
import KontaktOssScreen from './src/screens/KontaktOssScreen';
import VurderAppenScreen from './src/screens/VurderAppenScreen';
import LeiUtScreen from './src/screens/LeiUtScreen';
import RedigerPlassScreen from './src/screens/RedigerPlassScreen';
import InboksScreen from './src/screens/InboksScreen';
import KartScreen from './src/screens/KartScreen';
import LagretScreen from './src/screens/LagretScreen';
import HjemScreen from './src/screens/HjemScreen';
import BetalingPaakrevdScreen from './src/screens/BetalingPaakrevdScreen';
import BottomNav from './src/components/BottomNav';
import { SpotsProvider } from './src/context/SpotsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { BalanceProvider } from './src/context/BalanceContext';
import { ActiveBookingProvider } from './src/context/ActiveBookingContext';
import ParknoPremiumScreen from './src/screens/ParknoPremiumScreen';
import SaldoScreen from './src/screens/SaldoScreen';
import AktivParkeringScreen from './src/screens/AktivParkeringScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'red', marginBottom: 12 }}>CRASH:</Text>
          <Text style={{ fontSize: 13, color: '#333', marginBottom: 12 }}>{this.state.error.message}</Text>
          <Text style={{ fontSize: 11, color: '#999' }}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const wrap = (Screen) => (props) => <ErrorBoundary><Screen {...props} /></ErrorBoundary>;

const WWrappedWelcome                = wrap(WelcomeScreen);
const WWrappedLiveSpot               = wrap(LiveSpotScreen);
const WWrappedHost                   = wrap(HostScreen);
const WWrappedProfile                = wrap(ProfileScreen);
const WWrappedRedigerProfil          = wrap(RedigerProfilScreen);
const WWrappedBetalingsmetode        = wrap(BetalingsmetodeScreen);
const WWrappedReservasjonshistorikk  = wrap(ReservasjonshistorikkScreen);
const WWrappedVarsler                = wrap(VarslerScreen);
const WWrappedPersonvern             = wrap(PersonvernScreen);
const WWrappedHjelpFAQ               = wrap(HjelpFAQScreen);
const WWrappedKontaktOss             = wrap(KontaktOssScreen);
const WWrappedVurderAppen            = wrap(VurderAppenScreen);
const WWrappedLeiUt                  = wrap(LeiUtScreen);
const WWrappedRedigerPlass           = wrap(RedigerPlassScreen);
const WWrappedInboks                 = wrap(InboksScreen);
const WWrappedKart                   = wrap(KartScreen);
const WWrappedLagret                 = wrap(LagretScreen);
const WWrappedHjem                   = wrap(HjemScreen);
const WWrappedBetalingPaakrevd       = wrap(BetalingPaakrevdScreen);
const WWrappedParknoPremium          = wrap(ParknoPremiumScreen);
const WWrappedSaldo                  = wrap(SaldoScreen);
const WWrappedAktivParkering         = wrap(AktivParkeringScreen);

// Each tab is its own independent stack. Routes are owned by exactly one tab
// to avoid ambiguous `navigation.navigate(name)` resolution. Cross-tab jumps
// use `navigation.getParent().navigate('TabName', { screen: ... })`.

function HjemStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HjemRoot"         component={WWrappedHjem} />
      <Stack.Screen name="Welcome"          component={WWrappedWelcome} />
      <Stack.Screen name="LiveSpot"         component={WWrappedLiveSpot} />
      <Stack.Screen name="Lagret"           component={WWrappedLagret} />
      <Stack.Screen name="Inboks"           component={WWrappedInboks} />
      <Stack.Screen name="Host"             component={WWrappedHost} />
      <Stack.Screen name="LeiUt"            component={WWrappedLeiUt} />
      <Stack.Screen name="RedigerPlass"     component={WWrappedRedigerPlass} />
      <Stack.Screen name="BetalingPaakrevd" component={WWrappedBetalingPaakrevd} />
      <Stack.Screen name="AktivParkering"   component={WWrappedAktivParkering} />
    </Stack.Navigator>
  );
}

function KartStack() {
  // Routes get a "Kart" prefix so they don't collide with the same screens
  // registered in HjemStack — React Navigation otherwise warns about
  // ambiguous navigate() targets and behaves oddly on push().
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="KartRoot"             component={WWrappedKart} />
      <Stack.Screen name="KartLiveSpot"         component={WWrappedLiveSpot} />
      <Stack.Screen name="KartBetalingPaakrevd" component={WWrappedBetalingPaakrevd} />
      <Stack.Screen name="KartAktivParkering"   component={WWrappedAktivParkering} />
    </Stack.Navigator>
  );
}

function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Profile"               component={WWrappedProfile} />
      <Stack.Screen name="Saldo"                 component={WWrappedSaldo} />
      <Stack.Screen name="RedigerProfil"         component={WWrappedRedigerProfil} />
      <Stack.Screen name="Betalingsmetoder"      component={WWrappedBetalingsmetode} />
      <Stack.Screen name="Reservasjonshistorikk" component={WWrappedReservasjonshistorikk} />
      <Stack.Screen name="Varsler"               component={WWrappedVarsler} />
      <Stack.Screen name="Personvern"            component={WWrappedPersonvern} />
      <Stack.Screen name="HjelpFAQ"              component={WWrappedHjelpFAQ} />
      <Stack.Screen name="KontaktOss"            component={WWrappedKontaktOss} />
      <Stack.Screen name="VurderAppen"           component={WWrappedVurderAppen} />
      <Stack.Screen name="ParknoPremium"         component={WWrappedParknoPremium} />
    </Stack.Navigator>
  );
}

function CustomTabBar({ state, navigation }) {
  const tabNames = state.routes.map(route => route.name);
  const activeTab = state.routes[state.index]?.name;

  // Screens that should render full-bleed without the floating tab bar.
  const HIDE_ON = ['ParknoPremium'];
  const focusedRoute = getFocusedRouteNameFromRoute(state.routes[state.index]);
  if (focusedRoute && HIDE_ON.includes(focusedRoute)) {
    return null;
  }

  return (
    <BottomNav
      activeTab={activeTab}
      onLeiUtPress={() => {
        navigation.navigate('Hjem', { screen: 'LeiUt' });
      }}
      onTabPress={(tabId) => {
        const index = tabNames.indexOf(tabId);
        if (index === -1) return;

        const route = state.routes[index];
        const isFocused = state.index === index;

        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) return;

        if (isFocused) {
          // Re-press of the active tab → pop that tab's nested stack to its root.
          const nestedKey = route.state?.key;
          if (nestedKey) {
            navigation.dispatch({ ...StackActions.popToTop(), target: nestedKey });
          }
        } else {
          navigation.dispatch({
            ...TabActions.jumpTo(route.name),
            target: state.key,
          });
        }
      }}
    />
  );
}

function RootNavigator() {
  const { user, loading, devBypass } = useAuth();
  const navRef = useRef(null);

  useProximityAlerts();

  // Register push token for this user so others can notify them
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({ projectId }).catch(() => null);
      if (token?.data) {
        supabase.from('profiles').update({ push_token: token.data }).eq('id', user.id);
      }
    })();
  }, [user?.id]);

  // Navigate to LiveSpot when user taps a proximity notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const spot = response.notification.request.content.data?.spot;
      if (spot && navRef.current) {
        navRef.current.navigate('Hjem', { screen: 'LiveSpot', params: { spot } });
      }
    });
    return () => sub.remove();
  }, []);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#F4F3F2', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#4EA7B9" /></View>;
  }

  if (!user && !devBypass) {
    return <AuthScreen />;
  }

  return (
    <SpotsProvider>
      <NavigationContainer ref={navRef}>
        <StatusBar style="dark" />
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
          backBehavior="initialRoute"
        >
          <Tab.Screen name="Hjem"   component={HjemStack} />
          <Tab.Screen name="Kart"   component={KartStack} />
          <Tab.Screen name="Profil" component={ProfilStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </SpotsProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PremiumProvider>
          <BalanceProvider>
            <ActiveBookingProvider>
              <RootNavigator />
            </ActiveBookingProvider>
          </BalanceProvider>
        </PremiumProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
