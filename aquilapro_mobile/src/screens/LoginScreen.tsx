import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme/theme';
import { Shield, Eye, EyeOff } from 'lucide-react-native';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (role: 'parent' | 'guard' | 'teacher') => {
    // Simulating login for demo purposes
    if (role === 'parent') {
      navigation.navigate('ParentDashboard');
    } else if (role === 'guard') {
      navigation.navigate('GuardDashboard');
    } else {
      navigation.navigate('TeacherDashboard');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Shield color={theme.colors.primary} size={48} />
        </View>
        <Text style={styles.title}>ÁQUILA PRO</Text>
        <Text style={styles.subtitle}>Management Intelligence Hub</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email ou CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu acesso"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Sua senha"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOff color={theme.colors.textSecondary} size={20} /> : <Eye color={theme.colors.textSecondary} size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, styles.parentButton]} 
          onPress={() => handleLogin('parent')}
        >
          <Text style={styles.buttonText}>Acesso Pais</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, styles.teacherButton]} 
          onPress={() => handleLogin('teacher')}
        >
          <Text style={styles.buttonText}>Acesso Professor</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, styles.guardButton]} 
          onPress={() => handleLogin('guard')}
        >
          <Text style={styles.buttonText}>Acesso Segurança</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eyeIcon: {
    padding: 16,
  },
  loginButton: {
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  parentButton: {
    backgroundColor: theme.colors.primary,
  },
  teacherButton: {
    backgroundColor: '#8b5cf6',
  },
  guardButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});

export default LoginScreen;
