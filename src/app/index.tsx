import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { colors } from "@/styles/colors";
import { ArrowRight, Calendar as IconCalendar, MapPin, Settings2, UserRoundPlus } from "lucide-react-native";
import { useState } from "react";
import { Image, Text, View } from "react-native";

enum StepForm {
    TRIP_DETAILS = 1,
    ADD_EMAIL = 2
}

export default function Index() {
    const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
    const isTripDetails = stepForm === StepForm.TRIP_DETAILS;

    function handleNextStepForm() {
        if (isTripDetails) {
            return setStepForm(StepForm.ADD_EMAIL);
        }
    }

    return (
        <View className="flex-1 items-center justify-center px-5">
            <Image
                source={require("@/assets/logo.png")}
                className="h-8"
                resizeMode="contain"
            />

            <Image
                source={require("@/assets/bg.png")}
                className="absolute"
            />

            <Text className="text-zinc-500 font-regular text-center text-lg mt-3 mx-3">
                Invite your friends and plan your next trip!
            </Text>

            <View className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800">
                <Input variant="secondary">
                    <MapPin color={colors.zinc[400]} size={20} />
                    <Input.Field placeholder="Where?" editable={isTripDetails} />
                </Input>
                <Input variant="secondary">
                    <IconCalendar color={colors.zinc[400]} size={20} />
                    <Input.Field placeholder="When?" editable={isTripDetails} />
                </Input>

                {!isTripDetails && (
                    <>
                        <View className="border-b py-3 border-zinc-800">
                            <Button variant="secondary" onPress={() => setStepForm(StepForm.TRIP_DETAILS)}>
                                <Button.Title>Change local/date</Button.Title>
                                <Settings2 color={colors.zinc[200]} size={20} />
                            </Button>
                        </View>
                        <Input variant="secondary">
                            <UserRoundPlus color={colors.zinc[400]} size={20} />
                            <Input.Field placeholder="Who is going with you?" />
                        </Input>
                    </>
                )}

                <View className="mt-4">
                    <Button onPress={handleNextStepForm}>
                        <Button.Title>
                            {isTripDetails ? "Next" : "Confirm Trip"}
                        </Button.Title>
                        <ArrowRight color={colors.lime[950]} size={20} />
                    </Button>
                </View>
            </View>

            <Text className="text-zinc-500 font-regular text-center text-base">
                By planning your trip with plann.er, you atomatically agree with our
                {" "}
                <Text className="text-zinc-300 underline">
                    terms of use and privacy police
                </Text>
            </Text>
        </View>
    );
}