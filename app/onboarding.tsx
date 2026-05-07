import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const logo = require('../assets/logo.png');

export default function OnboardingScreen() {
  const [currentTab, setCurrentTab] = useState(0);
  const [name, setName] = useState('');
  const router = useRouter();

  const handleFinish = async () => {
    if (name.trim()) {
      await AsyncStorage.setItem('userName', name.trim());
      router.replace('/(tabs)');
    }
  };

  const renderTab = () => {
    switch (currentTab) {
      case 0:
        return (
          <View style={styles.tabContainer}>
            <Text style={styles.title}>Welcome to Tracksy</Text>
            <Text style={styles.subtitle}>Your personal expense tracker</Text>
            <TouchableOpacity style={styles.button} onPress={() => setCurrentTab(1)}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        );
      case 1:
        return (
          <View style={styles.tabContainer}>
            <Text style={styles.title}>Track Your Expenses</Text>
            <Text style={styles.description}>
              Easily manage your finances with Tracksy. Scan receipts, categorize expenses, and get insights into your spending habits.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => setCurrentTab(2)}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.tabContainer}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appName}>Tracksy</Text>
            <Text style={styles.label}>What’s your name?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              style={[styles.button, !name.trim() && styles.buttonDisabled]}
              onPress={handleFinish}
              disabled={!name.trim()}
            >
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {renderTab()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  tabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#723FEB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});