import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
const getDepartmentInfo = async (latitude: number, longitude: number) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
        const data = await response.json();
        const department = data.address && data.address.county;
        const departmentCode = data.address && data.address.postcode;
        return { department, departmentCode };
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du département:', error);
        return { department: 'Inconnu', departmentCode: 'Inconnu' };
    }
};
export default function CreateScreen() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [departmentInfo, setDepartmentInfo] = useState({ department: 'Inconnu', departmentCode: 'Inconnu' });
    const router = useRouter();
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Erreur', 'Permission de localisation non accordée.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            if (location) {
                const lat = location.coords.latitude.toFixed(6);
                const lon = location.coords.longitude.toFixed(6);
                setLatitude(lat);
                setLongitude(lon);
                const { department, departmentCode } = await getDepartmentInfo(location.coords.latitude, location.coords.longitude);
                setDepartmentInfo({ department, departmentCode });
            }
        })();
    }, []);
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Accès aux photos', 'Accès aux photos - refusé');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            const { uri } = result.assets[0];
            compressImage(uri);
        }
    };
    const compressImage = async (uri: string) => {
        try {
            const manipResult = await manipulateAsync(uri, [], {
                compress: 0.5, // Ajuste la qualité pour réduire la taille
                format: SaveFormat.JPEG,
            });
            setSelectedImage(manipResult.uri);
        } catch (error) {
            Alert.alert('Erreur', 'Échec de la compression de l\'image.');
        }
    };
    const handleLatitudeChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9.]/g, '');
        setLatitude(cleanedText);
    };
    const handleLongitudeChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9.]/g, '');
        setLongitude(cleanedText);
    };
    const handleSubmit = async () => {
        if (!title.trim() || !instructions.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
            return;
        }
        const finalLatitude = latitude.trim() ? latitude : "00.00";
        const finalLongitude = longitude.trim() ? longitude : "00.00";
        try {
            const existingData = await AsyncStorage.getItem('obstacles');
            const obstacles = existingData ? JSON.parse(existingData) : [];
            const newObstacle = {
                id: String(Date.now()),
                title,
                instructions,
                latitude: finalLatitude,
                longitude: finalLongitude,
                image: selectedImage,
                department: departmentInfo.department,
                departmentCode: departmentInfo.departmentCode,
            };
            obstacles.push(newObstacle);
            await AsyncStorage.setItem('obstacles', JSON.stringify(obstacles));
            setTitle('');
            setInstructions('');
            setLatitude('');
            setLongitude('');
            setSelectedImage(null);
            setDepartmentInfo({ department: 'Inconnu', departmentCode: 'Inconnu' });
            router.push('/explore');
        } catch (error) {
            Alert.alert('Erreur', 'Échec de l\'enregistrement de l\'obstacle.');
        }
    };
    const handleBack = () => {
        setTitle('');
        setInstructions('');
        setLatitude('');
        setLongitude('');
        setSelectedImage(null);
        setDepartmentInfo({ department: 'Inconnu', departmentCode: 'Inconnu' });
        router.push('/explore');
    };
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Création d'obstacle</Text>
            </View>
            <ScrollView contentContainerStyle={styles.formContainer}>
                <View style={styles.imageContainer}>
                    <Text style={styles.label}>Ajouter une image</Text>
                    <TouchableOpacity onPress={pickImage}>
                        <View style={styles.imageFrame}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage }} style={styles.image} />
                            ) : (
                                <Text style={styles.imagePlaceholder}>Choisir une image (optionnel)</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                <Text style={styles.label}>Titre *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Titre (obligatoire)"
                    value={title}
                    onChangeText={setTitle}
                />
                <Text style={styles.label}>Indications *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Indications (obligatoire)"
                    multiline
                    value={instructions}
                    onChangeText={setInstructions}
                />
                <Text style={styles.infoText}>Veuillez autoriser la géolocalisation sur votre appareil pour générer automatiquement les coordonnées GPS.</Text>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Latitude (optionnel)"
                    value={latitude}
                    onChangeText={handleLatitudeChange}
                    keyboardType="numeric"
                />
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Longitude (optionnel)"
                    value={longitude}
                    onChangeText={handleLongitudeChange}
                    keyboardType="numeric"
                />
                {latitude && longitude && (
                    <View style={styles.departmentInfoContainer}>
                        <Text style={styles.departmentInfo}>{`Département : ${departmentInfo.department}`}</Text>
                        <Text style={styles.departmentInfo}>{`Code : ${departmentInfo.departmentCode}`}</Text>
                    </View>
                )}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.backButton]}
                        onPress={handleBack}
                    >
                        <Text style={styles.buttonText}>Retour</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.addButton]}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.buttonText}>Ajouter</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
const commonTextStyles = {
    fontSize: 16,
    color: '#000',
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#1D3D47',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        padding: 16,
    },
    imageContainer: {
        marginBottom: 16,
    },
    label: {
        ...commonTextStyles,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    imageFrame: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 8,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        color: '#888',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    textArea: {
        height: 75,
        paddingTop: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        borderRadius: 5,
        marginHorizontal: 5,
        justifyContent: 'center',
    },
    backButton: {
        backgroundColor: '#f44336',
    },
    addButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 12,
    },
    departmentInfoContainer: {
        marginTop: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    departmentInfo: {
        fontSize: 14,
        color: '#000',
        textAlign: 'center', 
        marginBottom: 4,
    },
});
