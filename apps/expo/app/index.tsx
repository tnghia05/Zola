import { Text, View } from "react-native";
import { PlaceholderHome } from "@zola/app";

export default function ExpoHome() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{PlaceholderHome()}</Text>
    </View>
  );
}

