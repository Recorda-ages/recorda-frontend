import { useEffect } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/app/navigation/RootNavigator";

export function RecordaViewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, "RecordaView">>();
  useEffect(() => {
    navigation.replace("PublishedRecorda", { postId: params.recordaId });
  }, [navigation, params.recordaId]);
  return null;
}
