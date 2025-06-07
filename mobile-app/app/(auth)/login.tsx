import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Eye, EyeOff, Mail, Lock, Brain } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { Colors } from '../../constants/Colors';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Brain size={48} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>RetailAI</Text>
          <Text style={styles.subtitle}>Manager</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.description}>Sign in to manage your retail operations</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={Colors.gray500} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.gray500} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.gray500} />
                ) : (
                  <Eye size={20} color={Colors.gray500} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.linkText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    padding: 15,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 25,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.gray300,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  passwordToggle: {
    padding: 5,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: Colors.primary,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
});