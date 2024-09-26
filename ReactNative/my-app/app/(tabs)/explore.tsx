import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Button, Text, Pressable, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
interface Obstacle {
  id: string;
  title: string;
  instructions: string;
  latitude: string;
  longitude: string;
  image: any;
  department: string;
  departmentCode: string;
}

const exampleObstacle: Obstacle = {
  id: '1',
  title: 'Incendie',
  instructions: 'Un incendie bloque la route, il faut donc passer par les petites routes de campagnes depuis Metz.',
  latitude: '49.106841',
  longitude: '6.176418',
  image: require('../../assets/images/fire-forest.jpeg'),
  department: 'Moselle',
  departmentCode: '57000',
};
const renderObstacle = ({ item, onDelete }: { item: Obstacle, onDelete: (id: string) => void }) => (
  <View style={styles.row}>
    {item.image ? (
      <Image source={item.image} style={styles.image} />
    ) : (
      <View style={[styles.image, styles.imagePlaceholder]}>
        <Text style={styles.imagePlaceholderText}>Aucune image</Text>
      </View>
    )}
    <View style={styles.headerContent}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinateText}>{`Longitude : ${item.longitude}`}</Text>
        <Text style={styles.coordinateText}>{`Latitude : ${item.latitude}`}</Text>
        <Text style={styles.coordinateText}>{`${item.departmentCode}, ${item.department}`}</Text>
      </View>
    </View>
    <Text style={styles.instructions}>{item.instructions}</Text>
    <View style={styles.buttonContainer}>
      <Button title="Supprimer" color="#ff4d4d" onPress={() => onDelete(item.id)} />
    </View>
  </View>
);
export default function ExploreScreen() {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  useEffect(() => {
    const fetchObstacles = async () => {
      try {
        const storedObstacles = await AsyncStorage.getItem('obstacles');
        let storedObstaclesList: Obstacle[] = storedObstacles ? JSON.parse(storedObstacles) : [];
        const hasExampleObstacle = storedObstaclesList.some(obstacle => obstacle.id === exampleObstacle.id);
        if (!hasExampleObstacle) {
          storedObstaclesList = [exampleObstacle, ...storedObstaclesList];
          await AsyncStorage.setItem('obstacles', JSON.stringify(storedObstaclesList));
        }
        setObstacles(storedObstaclesList);
      } catch (error) {
        console.error('Erreur lors de la récupération des obstacles :', error);
      }
    };
    fetchObstacles();
  }, []);
  const handleDelete = async (id: string) => {
    try {
      const updatedObstacles = obstacles.filter(obstacle => obstacle.id !== id);
      await AsyncStorage.setItem('obstacles', JSON.stringify(updatedObstacles));
      setObstacles(updatedObstacles);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'obstacle :', error);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Liste des obstacles</Text>
      </View>
      <FlatList
        data={obstacles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderObstacle({ item, onDelete: handleDelete })}
        contentContainerStyle={styles.listContainer}
      />
      <Link href="/create" asChild>
        <Pressable style={styles.floatingButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#0000FF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  row: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    marginBottom: 8,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  imagePlaceholderText: {
    color: '#888',
    fontSize: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  coordinatesContainer: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  coordinateText: {
    fontSize: 14,
    color: '#000',
  },
  instructions: {
    fontSize: 14,
    color: '#000',
    marginVertical: 8,
    textAlign: 'left',
  },
  buttonContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 55,
    right: 20,
    backgroundColor: '#0000FF',
    borderRadius: 50,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
});