import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { Input } from "@/components/input";
import { Loading } from "@/components/loading";
import { Modal } from "@/components/modal";
import { TripDetails, tripServer } from "@/server/trip-server";
import { colors } from "@/styles/colors";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarRange, Edit, Calendar as IconCalendar, Info, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Keyboard, TouchableOpacity, View } from "react-native";
import { DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";

import { Activities } from "./activities";
import { Details } from "./details";

export type TripData = TripDetails & { when: string }

enum MODAL {
    NONE = 0,
    UPDATE_TRIP = 1,
    UPDATE_CALENDAR = 2
}

export default function Trip() {
    const [isLoadingTrip, setIsLoadingTrip] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showModal, setShowModal] = useState(MODAL.NONE);

    const [tripDetails, setTripDetails] = useState({} as TripData);
    const [option, setOption] = useState<"activity" | "details">("activity");
    const [destination, setDestination] = useState("");
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
    const [markedDates, setMarkedDates] = useState({} as MarkedDates);

    const tripId = useLocalSearchParams<{ id: string }>().id;
    const isActivity = option === "activity";

    async function getTripDetails() {
        try {
            setIsLoadingTrip(true);

            if (!tripId) {
                return router.back();
            }

            const trip = await tripServer.getById(tripId);
            const maxLengthDestination = 12;
            const destination = trip.destination.length > maxLengthDestination
                ? trip.destination.slice(0, maxLengthDestination) + "..."
                : trip.destination;

            const startDay = dayjs(trip.starts_at).format("DD");
            const endDay = dayjs(trip.ends_at).format("DD");
            const startMonth = dayjs(trip.starts_at).format("MMM");
            const endMonth = dayjs(trip.ends_at).format("MMM");
            const formatedDate = startMonth === endMonth
                ? `de ${startDay} à ${endDay} de ${endMonth}`
                : `de ${startDay} de ${startMonth} à ${endDay} de ${endMonth}`;

            setTripDetails({ ...trip, when: `${destination} ${formatedDate}.` });
            setDestination(destination);

        } catch (error) {
            console.log(error);
        } finally {
            setIsLoadingTrip(false);
        }
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

    async function handleUpdate() {
        try {
            if (!tripId) {
                return;
            }

            if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
                return Alert.alert("Update Trip",
                    "Remember to fill destination, as well as the start and end date of your trip");
            }

            setIsUpdating(true);

            await tripServer.update({
                id: tripId,
                destination,
                starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt.dateString).toString()
            });

            Alert.alert("Update Trip", "Trip updated successfuly", [
                {
                    text: "OK",
                    onPress: () => {
                        setShowModal(MODAL.NONE);
                        getTripDetails();
                    }
                }
            ]);

        } catch (error) {
            console.log(error);
        } finally {
            setIsUpdating(false);
        }
    }

    useEffect(() => { getTripDetails() }, []);

    if (isLoadingTrip) {
        return <Loading />
    }

    return (
        <View className="flex-1 px-5 pt-16">
            <Input variant="tertiary">
                <MapPin color={colors.zinc[400]} size={20} />

                <Input.Field value={tripDetails.when} readOnly />

                <View className="w-9 h-9 bg-zinc-800 items-center justify-center rounded">
                    <TouchableOpacity onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
                        <Edit color={colors.zinc[400]} size={20} />
                    </TouchableOpacity>
                </View>
            </Input>

            {isActivity ? <Activities tripDetails={tripDetails} /> : <Details tripId={tripDetails.id} />}

            <View className="w-full absolute -bottom-1  self-center justify-end pb-5 z-10 bg-zinc-950">
                <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-l-zinc-800 gap-2">
                    <Button
                        className="flex-1"
                        onPress={() => setOption("activity")}
                        variant={isActivity ? "primary" : "secondary"}
                    >
                        <CalendarRange size={20}
                            color={isActivity ? colors.lime[950] : colors.zinc[200]} />
                        <Button.Title>Activities</Button.Title>
                    </Button>
                    <Button
                        className="flex-1"
                        onPress={() => setOption("details")}
                        variant={!isActivity ? "primary" : "secondary"}
                    >
                        <Info size={20}
                            color={!isActivity ? colors.lime[950] : colors.zinc[200]} />
                        <Button.Title>Details</Button.Title>
                    </Button>
                </View>
            </View>

            <Modal
                title="Update Trip"
                subtitle="Only the host can change"
                visible={showModal === MODAL.UPDATE_TRIP}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="my-4 gap-2">
                    <Input variant="secondary">
                        <MapPin color={colors.zinc[400]} size={20} />
                        <Input.Field placeholder="Where?"
                            onChangeText={setDestination}
                            value={destination}
                        />
                    </Input>

                    <Input variant="secondary">
                        <IconCalendar color={colors.zinc[400]} size={20} />
                        <Input.Field placeholder="When?"
                            onFocus={() => Keyboard.dismiss()}
                            showSoftInputOnFocus={false}
                            onPressIn={() => setShowModal(MODAL.UPDATE_CALENDAR)}
                            value={selectedDates.formatDatesInText}
                        />
                    </Input>

                    <Button className="mt-4" onPress={handleUpdate} isLoading={isUpdating}>
                        <Button.Title>Update</Button.Title>
                    </Button>
                </View>
            </Modal>

            <Modal
                title="Date Selection"
                subtitle="Select the start and end date of your trip"
                visible={showModal === MODAL.UPDATE_CALENDAR}
                onClose={() => setShowModal(MODAL.UPDATE_TRIP)}
            >
                <View className="gap-4 mt-4">
                    <Calendar
                        onDayPress={handleSelectedDate}
                        minDate={dayjs().toISOString()}
                        markedDates={markedDates}
                    />
                    <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
                        <Button.Title>Confirm</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    );
}