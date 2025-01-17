import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { PropTypes } from 'prop-types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { saveProfileData, loadProfileData } from '../src/utils/firestoreUtils';
import { auth } from '../firebaseConfig';
import styles from '../src/styles/ProfileStyles.js';

const Profile = ({ route, navigation }) => {
  const userEmail = route.params?.userEmail || auth.currentUser?.email || '';
  const userId = auth.currentUser?.uid || '';

  const [user, setUser] = useState({
    name: 'Кристиян Бързилов',
    email: userEmail,
    profilePicture: null,
  });

  // Полета за профила
  const [bio, setBio] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [huntingLicense, setHuntingLicense] = useState({ start: '', end: '' });
  const [huntingNotes, setHuntingNotes] = useState({ start: '', end: '' });
  const [equipment, setEquipment] = useState([{ name: '', model: '', caliber: '' }]);
  const [dogBreed, setDogBreed] = useState('');
  const [gallery, setGallery] = useState([]);
  const [isGroupHunting, setIsGroupHunting] = useState(false);
  const [isSelectiveHunting, setIsSelectiveHunting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);
  const [showNotesDatePicker, setShowNotesDatePicker] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const dogOptions = ['Дратхаар', 'Гонче', 'Кокершпаньол'];

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileData = await loadProfileData(userId);
        if (profileData) {
          setBio(profileData.bio || '');
          setLicenseType(profileData.licenseType || '');
          setHuntingLicense(profileData.huntingLicense || { start: '', end: '' });
          setHuntingNotes(profileData.huntingNotes || { start: '', end: '' });
          setEquipment(profileData.equipment || [{ name: '', model: '', caliber: '' }]);
          setDogBreed(profileData.dogBreed || '');
          setGallery(profileData.gallery || []);
          setIsGroupHunting(profileData.isGroupHunting || false);
          setIsSelectiveHunting(profileData.isSelectiveHunting || false);
          
          setUser((prevUser) => ({
            ...prevUser,
            profilePicture: profileData.profilePicture || null,
          }));
        }
      } catch (error) {
        console.error('Грешка при зареждане на данни:', error.message);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleSaveChanges = async () => {
    const profileData = {
      profilePicture: newProfilePicture || user.profilePicture,
      bio,
      licenseType,
      huntingLicense,
      huntingNotes,
      equipment,
      dogBreed,
      gallery,
      isGroupHunting,
      isSelectiveHunting,
    };
  
    try {
      if (newProfilePicture) {
        const storage = getStorage();
        const response = await fetch(newProfilePicture);
        if (!response.ok) {
          throw new Error('URI е недостъпен. Проверете валидността на файла.');
        }
        const blob = await response.blob();
  
        const fileRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(fileRef, blob);
  
        const downloadUrl = await getDownloadURL(fileRef);
        profileData.profilePicture = downloadUrl;
      }
  
      await saveProfileData(userId, profileData);
      setUser((prevUser) => ({ ...prevUser, profilePicture: profileData.profilePicture }));
      setIsEditing(false);

      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      Alert.alert('Грешка', `Неуспешно записване на профила: ${error.message}`);
    }
  };
  

  const handleProfilePictureChange = async () => {
    if (!isEditing) {
      console.log('Промяната на профилната снимка е неактивна извън режим на редактиране.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Нужно е разрешение', 'Моля, дайте разрешение за достъп до галерията.');
      return;
    }

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('Резултат от ImagePicker:', pickerResult);

      if (!pickerResult.canceled) {
        const selectedImage = pickerResult.assets && pickerResult.assets[0];
        if (selectedImage?.uri) {
          console.log('Нов URI на изображението:', selectedImage.uri);
          setNewProfilePicture(selectedImage.uri);
        } else {
          console.error('URI е недефиниран, въпреки че изборът не е отказан.');
        }
      } else {
        console.log('Изборът на изображение е отказан.');
      }
    } catch (error) {
      console.error('Грешка при избора на изображение:', error.message);
      Alert.alert('Грешка', 'Неуспешно избиране на изображение. Опитайте отново.');
    }
  };

  const handleLogOut = async () => {
    try {
      setUser({
        name: '',
        email: '',
        profilePicture: newProfilePicture || user.profilePicture,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Грешка при изход:', error);
    }
  };

  const handleLicenseDateChange = (event, selectedDate) => {
    setShowLicenseDatePicker(false);
    if (selectedDate) {
      const startDate = selectedDate.toISOString().split('T')[0];
      const endDate = new Date(selectedDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setHuntingLicense({ start: startDate, end: formattedEndDate });
    }
  };

  const handleNotesDateChange = (event, selectedDate) => {
    setShowNotesDatePicker(false);
    if (selectedDate) {
      const startDate = selectedDate.toISOString().split('T')[0];
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setHuntingNotes({ start: startDate, end: formattedEndDate });
    }
  };

  const handleAddEquipment = () => {
    setEquipment([...equipment, { name: '', model: '', caliber: '' }]);
  };

  const handleUpdateEquipment = (index, field, value) => {
    const updatedEquipment = [...equipment];
    updatedEquipment[index][field] = value;
    setEquipment(updatedEquipment);
  };

  // eslint-disable-next-line react/prop-types
  const Popup = ({ message }) => {
    return (
      <View style={styles.popupContainer}>
        <Text style={styles.popupText}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
        {showPopup && <Popup message="Промените са запазени успешно!" />}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профил</Text>
        <TouchableOpacity onPress={handleLogOut}>
          <Ionicons name="log-out-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
        <View style={styles.profileInfo}>
        <TouchableOpacity onPress={handleProfilePictureChange}>
            {isEditing ? (
            <TouchableOpacity onPress={handleProfilePictureChange}>
              {newProfilePicture ? (
                <Image source={{ uri: newProfilePicture }} style={styles.profilePicture} />
              ) : user.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
              ) : (
                <Ionicons name="person-circle" size={100} color="gray" />
              )}
            </TouchableOpacity>
          ) : user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          ) : (
            <Ionicons name="person-circle" size={100} color="gray" />
          )}
          </TouchableOpacity>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        <View style={styles.profileDetailsContainer}>
          <Text style={styles.sectionTitle}>Биография</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              placeholder="Напишете кратка биография"
              value={bio}
              onChangeText={setBio}
              multiline
            />
          ) : (
            <Text>{bio || 'Няма въведена биография'}</Text>
          )}

            <Text style={styles.sectionTitle}>Ловен лиценз</Text>
            {isEditing ? (
            <View>
                <View style={styles.checkboxContainer}>
                <Checkbox
                    status={isGroupHunting ? 'checked' : 'unchecked'}
                    onPress={() => setIsGroupHunting(!isGroupHunting)}
                />
                <Text>Групов лов</Text>
                </View>
                <View style={styles.checkboxContainer}>
                <Checkbox
                    status={isSelectiveHunting ? 'checked' : 'unchecked'}
                    onPress={() => setIsSelectiveHunting(!isSelectiveHunting)}
                    disabled={!isGroupHunting}
                />
                <Text>Подборен лов</Text>
                </View>
            </View>
            ) : (
            <Text>
                {isGroupHunting && isSelectiveHunting
                ? 'Групов лов, Подборен лов'
                : isGroupHunting
                ? 'Групов лов'
                : 'Няма избран лиценз'}
            </Text>
            )}

          <Text style={styles.sectionTitle}>Ловен билет</Text>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowLicenseDatePicker(true)}
              >
                <Text>Изберете начална дата</Text>
              </TouchableOpacity>
              {showLicenseDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleLicenseDateChange}
                />
              )}
              <Text>
                Начална дата: {huntingLicense.start || 'Не е избрано'}
              </Text>
              <Text>
                Крайна дата: {huntingLicense.end || 'Не е изчислено'}
              </Text>
            </>
          ) : (
            <Text>
              {huntingLicense.start
                ? `${huntingLicense.start} - ${huntingLicense.end}`
                : 'Няма въведен ловен билет'}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Ловна бележка</Text>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowNotesDatePicker(true)}
              >
                <Text>Изберете начална дата</Text>
              </TouchableOpacity>
              {showNotesDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleNotesDateChange}
                />
              )}
              <Text>
                Начална дата: {huntingNotes.start || 'Не е избрано'}
              </Text>
              <Text>
                Крайна дата: {huntingNotes.end || 'Не е изчислено'}
              </Text>
            </>
          ) : (
            <Text>
              {huntingNotes.start
                ? `${huntingNotes.start} - ${huntingNotes.end}`
                : 'Няма въведена ловна бележка'}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Оръжия</Text>
          {equipment.map((eq, index) => (
            <View key={index}>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Име"
                    value={eq.name}
                    onChangeText={(text) => handleUpdateEquipment(index, 'name', text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Модел"
                    value={eq.model}
                    onChangeText={(text) => handleUpdateEquipment(index, 'model', text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Калибър"
                    value={eq.caliber}
                    onChangeText={(text) => handleUpdateEquipment(index, 'caliber', text)}
                  />
                </>
              ) : (
                <Text>{`Име: ${eq.name}\nМодел: ${eq.model}\nКалибър: ${eq.caliber}`}</Text>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity onPress={handleAddEquipment}>
              <Text style={styles.addButtonText}>Добави оръжие</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Куче</Text>
          {isEditing ? (
            <Picker
              selectedValue={dogBreed}
              onValueChange={(itemValue) => setDogBreed(itemValue)}
              style={styles.input}
            >
              {dogOptions.map((dog, index) => (
                <Picker.Item key={index} label={dog} value={dog} />
              ))}
            </Picker>
          ) : (
            <Text>{dogBreed || 'Няма въведена порода куче'}</Text>
          )}

          <Text style={styles.sectionTitle}>Галерия</Text>
          <Text>Галерията е в разработка</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Запази промените' : 'Редактирай профила'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {showPopup && <Popup message="Промените са запазени успешно!" />}
    </View>
  );
};

Profile.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      userEmail: PropTypes.string,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
  }).isRequired,
};

export default Profile;