import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const BUTTON_ROWS = [
    ['AC', 'DEL', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', ''],
] as const;

export default function CalculatorScreen() {
    const theme = useColorScheme() ?? 'light';
    const activeColors = Colors[theme];
    const [currentValue, setCurrentValue] = useState('0');
    const [previousValue, setPreviousValue] = useState<string | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [overwrite, setOverwrite] = useState(true);

    function formatNumber(value: string) {
        if (value === 'Error') {
            return value;
        }
        const [integer, fraction] = value.split('.');
        const formattedInt = parseFloat(integer).toLocaleString('en-US');
        return fraction ? `${formattedInt}.${fraction}` : formattedInt;
    }

    function handleDigitPress(digit: string) {
        if (overwrite || currentValue === '0') {
            setCurrentValue(digit);
            setOverwrite(false);
            return;
        }
        setCurrentValue((prev) => `${prev}${digit}`);
    }

    function handleDotPress() {
        if (overwrite) {
            setCurrentValue('0.');
            setOverwrite(false);
            return;
        }
        if (currentValue.includes('.')) {
            return;
        }
        setCurrentValue((prev) => `${prev}.`);
    }

    function handleClear() {
        setCurrentValue('0');
        setPreviousValue(null);
        setOperator(null);
        setOverwrite(true);
    }

    function handleDelete() {
        if (overwrite || currentValue.length === 1) {
            setCurrentValue('0');
            setOverwrite(true);
            return;
        }
        setCurrentValue((prev) => prev.slice(0, -1));
    }

    function computeResult(a: string, op: string, b: string) {
        const first = parseFloat(a);
        const second = parseFloat(b);
        if (Number.isNaN(first) || Number.isNaN(second)) {
            return '0';
        }
        switch (op) {
            case '+':
                return String(first + second);
            case '-':
                return String(first - second);
            case '×':
                return String(first * second);
            case '÷':
                return second === 0 ? 'Error' : String(first / second);
            default:
                return '0';
        }
    }

    function handleOperatorPress(nextOperator: string) {
        if (operator && previousValue !== null && !overwrite) {
            const result = computeResult(previousValue, operator, currentValue);
            setPreviousValue(result);
            setCurrentValue(result);
        } else if (!overwrite) {
            setPreviousValue(currentValue);
        }

        setOperator(nextOperator);
        setOverwrite(true);
    }

    function handleEqualsPress() {
        if (!operator || previousValue === null) {
            return;
        }

        const result = computeResult(previousValue, operator, currentValue);

        setCurrentValue(result);
        setPreviousValue(result); 
        setOperator(null);
        setOverwrite(true);
    }

    function handleButtonPress(value: string) {
        if (value === 'AC') {
            handleClear();
            return;
        }
        if (value === 'DEL') {
            handleDelete();
            return;
        }
        if (value === '=') {
            handleEqualsPress();
            return;
        }
        if (['+', '-', '×', '÷'].includes(value)) {
            handleOperatorPress(value);
            return;
        }
        if (value === '.') {
            handleDotPress();
            return;
        }
        handleDigitPress(value);
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <View style={styles.header}>
                <Link href="/" asChild>
                    <Pressable style={styles.backButton}>
                        <Ionicons name="arrow-back" size={20} color={activeColors.tint} />
                    </Pressable>
                </Link>
                <Text style={[styles.title, { color: activeColors.text }]}>Calculator</Text>
            </View>

            <View style={[styles.displayContainer, { backgroundColor: theme === 'light' ? '#F5F7FB' : '#1B1B22' }]}>
                <Text style={[styles.expressionText, { color: activeColors.icon }]}>
                    {previousValue && operator ? `${formatNumber(previousValue)} ${operator}` : ''}
                </Text>
                <Text style={[styles.valueText, { color: activeColors.text }]}>
                    {formatNumber(currentValue)}
                </Text>
            </View>

            <View style={styles.grid}>
                {BUTTON_ROWS.map((row) => (
                    <View key={row.join('-')} style={styles.row}>
                        {row.map((button) => {
                            const isEmpty = button === '';
                            const isOperator = ['+', '-', '×', '÷', '='].includes(button);
                            const isControl = ['AC', 'DEL'].includes(button);
                            const isWide = button === '0';
                            return (
                                <Pressable
                                    key={button || 'empty'}
                                    style={({ pressed }) => [
                                        styles.button,
                                        isWide && styles.buttonWide,
                                        isOperator ? styles.operatorButton : styles.numberButton,
                                        isControl && styles.controlButton,
                                        isEmpty && styles.buttonEmpty,
                                        pressed && !isEmpty && styles.buttonPressed,
                                    ]}
                                    onPress={() => !isEmpty && handleButtonPress(button)}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            isOperator || isControl ? styles.operatorButtonText : styles.numberButtonText,
                                        ]}
                                    >
                                        {button}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 18,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 16,
        backgroundColor: '#723FEB20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    displayContainer: {
        marginHorizontal: 10,
        borderRadius: 24,
        padding: 20,
        minHeight: 120,
        justifyContent: 'flex-end',
    },
    expressionText: {
        fontSize: 16,
        textAlign: 'right',
        marginBottom: 8,
    },
    valueText: {
        fontSize: 49,
        fontWeight: '700',
        textAlign: 'right',
    },
    grid: {
        marginTop: 8,
        marginHorizontal: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    button: {
        flex: 1,
        height: 65,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    numberButton: {
        backgroundColor: '#F4F5FB',
    },
    buttonWide: {
        flex: 2,
        alignItems: 'flex-start',
        paddingLeft: 28,
    },
    buttonEmpty: {
        backgroundColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
    },
    operatorButton: {
        backgroundColor: '#723FEB',
    },
    controlButton: {
        backgroundColor: '#E9E5FF',
    },
    buttonText: {
        fontSize: 28,
        fontWeight: '700',
    },
    numberButtonText: {
        color: '#111827',
    },
    operatorButtonText: {
        color: '#FFFFFF',
    },
    buttonPressed: {
        opacity: 0.8,
    },
});
