import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { GuestEmail } from "@/components/email";
import { Input } from "@/components/input";
import { Loading } from "@/components/loading";
import { Modal } from "@/components/modal";
import { tripServer } from "@/server/trip-server";
import { tripStorage } from "@/storage/trip";
import { colors } from "@/styles/colors";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { validateInput } from "@/utils/validateInput";
import dayjs from "dayjs";
import { router } from "expo-router";
import { ArrowRight, AtSign, Calendar as IconCalendar, MapPin, Settings2, UserRoundPlus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Image, Keyboard, Text, View } from "react-native";
import { DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";

enum StepForm {
    TRIP_DETAILS = 1,
    ADD_EMAIL = 2
}
enum MODAL {
    NONE = 0,
    CALENDAR = 1,
    GUESTS = 2
}

export default function Index() {
    const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
    const [showModal, setShowModal] = useState(MODAL.NONE);

    const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
    const [markedDates, setMarkedDates] = useState({} as MarkedDates);
    const [destination, setDestination] = useState("");
    const [emailToInvite, setEmailToInvite] = useState("");
    const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);

    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    const [isGettingTrip, setIsGettingTrip] = useState(true);

    const isTripDetails = stepForm === StepForm.TRIP_DETAILS;

    function handleNextStepForm() {
        if (destination.trim().length === 0 || !selectedDates.startsAt
            || !selectedDates.endsAt) {
            return Alert.alert("Trip Details", "Fill all fields");
        }

        if (destination.length < 4) {
            return Alert.alert("Trip Details", "Destiny must have 4 characters at least");
        }

        if (isTripDetails) {
            return setStepForm(StepForm.ADD_EMAIL);
        }

        Alert.alert("New Trip", "Confirm action", [
            {
                text: "No",
                style: "cancel"
            },
            {
                text: "Yes",
                onPress: createTrip
            }
        ]);
    }

    function handleSelectedDate(selectedDay: DateData) {
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        });

        setSelectedDates(dates);
        setMarkedDates(calendarUtils.getIntervalDates(dates.startsAt, selectedDay));
    }

    function handleRemoveEmail(emailToRemove: string) {
        setEmailsToInvite(prevState => prevState.filter(email => email !== emailToRemove));
    }

    function handleAddEmail() {
        if (!validateInput.email(emailToInvite)) {
            return Alert.alert("Guest", "Invalid e-mail");
        }

        const emailAlreadyExist = emailsToInvite.find(email => email === emailToInvite);

        if (emailAlreadyExist) {
            return Alert.alert("Guest", "E-mail already added");
        }

        setEmailsToInvite(prevState => [...prevState, emailToInvite]);
        setEmailToInvite("");
    }

    async function createTrip() {
        try {
            setIsCreatingTrip(true);
            const newTripe = await tripServer.create({
                destination,
                starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
                emails_to_invite: emailsToInvite
            });

            Alert.alert("New Trip", "Trip created successfuly", [
                {
                    text: "OK. Continue",
                    onPress: () => saveTripOnDevice(newTripe.tripId)
                }
            ]);
        } catch (error) {
            setIsCreatingTrip(false);
            Alert.alert("Create Trip", "Couldn't complete action");
            console.log(error);
        }
    }

    async function saveTripOnDevice(tripId: string) {
        try {
            await tripStorage.save(tripId);
            router.navigate(`/trip/${tripId}`);
        } catch (error) {
            Alert.alert("Save Trip", "Couldn't complete action");
            console.log(error);
        }
    }

    async function getTrip() {
        try {
            const tripId = await tripStorage.get();

            if (!tripId) {
                return setIsGettingTrip(false);
            }

            const trip = await tripServer.getById(tripId);

            if (trip) {
                return router.navigate(`/trip/${trip.id}`);
            }
        } catch (error) {
            setIsGettingTrip(false);
            console.log(error);
        }
    }

    useEffect(() => { getTrip() }, []);

    if (isGettingTrip) {
        return <Loading />
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
                    <Input.Field placeholder="Where?" editable={isTripDetails}
                        onChangeText={setDestination} value={destination} />
                </Input>
                <Input variant="secondary">
                    <IconCalendar color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder="When?" editable={isTripDetails}
                        onFocus={() => Keyboard.dismiss()}
                        showSoftInputOnFocus={false}
                        onPressIn={() => isTripDetails && setShowModal(MODAL.CALENDAR)}
                        value={selectedDates.formatDatesInText}
                    />
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
                            <Input.Field
                                placeholder="Who is going with you?"
                                autoCorrect={false}
                                value={
                                    emailsToInvite.length > 0
                                        ? `${emailsToInvite.length} guest(s) invited`
                                        : ""
                                }
                                onPress={() => {
                                    Keyboard.dismiss()
                                    setShowModal(MODAL.GUESTS)
                                }}
                                showSoftInputOnFocus={false}
                            />
                        </Input>
                    </>
                )}

                <View className="mt-4">
                    <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
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

            <Modal
                title="Date Selection"
                subtitle="Select the start and end date of your trip"
                visible={showModal === MODAL.CALENDAR}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="gap-4 mt-4">
                    <Calendar
                        onDayPress={handleSelectedDate}
                        minDate={dayjs().toISOString()}
                        markedDates={markedDates}
                    />
                    <Button onPress={() => setShowModal(MODAL.NONE)}>
                        <Button.Title>Confirm</Button.Title>
                    </Button>
                </View>
            </Modal>

            <Modal
                title="Invite your friends"
                subtitle="Your guests will receive an e-mail confirming they are going"
                visible={showModal === MODAL.GUESTS}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start">
                    {emailsToInvite.length > 0 ? (
                        emailsToInvite.map(email => (
                            <GuestEmail key={email} email={email}
                                onRemove={() => handleRemoveEmail(email)} />
                        ))
                    ) : (
                        <Text className="text-zinc-500 text-base font-regular">
                            No e-mails added
                        </Text>
                    )}
                </View>
                <View className="gap-4">
                    <Input variant="secondary">
                        <AtSign color={colors.zinc[400]} size={20} />
                        <Input.Field
                            placeholder="Enter your friend's e-mail"
                            keyboardType="email-address"
                            onChangeText={setEmailToInvite}
                            value={emailToInvite}
                            returnKeyType="send"
                            onSubmitEditing={handleAddEmail}
                        />
                    </Input>
                    <Button onPress={handleAddEmail}>
                        <Button.Title>Invite</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    );
}