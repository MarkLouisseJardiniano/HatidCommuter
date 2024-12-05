import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

const CompletionMessage = () => {
    const navigation = useNavigation();

    const handleContinue = () => {
        navigation.navigate('Login');
    }

  return (
    <View style={{    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
        paddingVertical: "50%",
      }}>
      <Text style={{fontSize: 24, fontWeight: "bold"}}>Account Created Successfully!</Text>
      <View       style={{
        justifyContent: "center",
        alignItems: "center",
      }}>
      <Image
        source={imagePath.check}
        style={{
          height: 100,
          width: 200,
          paddingVertical: 100,

        }} 
      />
      </View>
      <Text style={{fontSize: 16, color: "gray"}}>
      Congratulations, your account has been created.
      </Text>
<View style={{  width: "100%", padding: 40}}>
<TouchableOpacity onPress={handleContinue} style={{backgroundColor: "powderblue", padding: 10, borderRadius: 10 }}>
        <Text style={{textAlign: "center", color: "black", fontSize: 18, fontWeight: "bold"}}>Continue</Text>
      </TouchableOpacity>
</View>

    </View>
  )
}

export default CompletionMessage

const styles = StyleSheet.create({})