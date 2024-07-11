import { Text, View } from "react-native";

export function Details({ tripId }: { tripId: string }) {
    return (
        <View className="flex-1">
            <Text className="text-zinc-50">{tripId}</Text>
        </View>
    );
}