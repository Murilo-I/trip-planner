import { Activity, ActivityProps } from "@/components/activity";
import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { Input } from "@/components/input";
import { Loading } from "@/components/loading";
import { Modal } from "@/components/modal";
import { activitiesServer } from "@/server/activities-server";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Clock, Calendar as IconCalendar, PlusIcon, Tag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Keyboard, SectionList, Text, View } from "react-native";

import { TripData } from "./[id]";

type Props = {
    tripDetails: TripData
}

type TripActivities = {
    title: {
        dayNumber: number
        dayName: string
    }
    data: ActivityProps[]
}

enum MODAL {
    NONE = 0,
    CALENDAR = 1,
    NEW_ACTIVITY = 2
}

export function Activities({ tripDetails }: Props) {
    const [showModal, setShowModal] = useState(MODAL.NONE);

    const [isCreatingActivity, setIsCreatingActivity] = useState(false);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

    const [activityTitle, setActivityTitle] = useState("");
    const [activityDate, setActivityDate] = useState("");
    const [activityHour, setActivityHour] = useState("");
    const [activities, setActivities] = useState<TripActivities[]>([]);

    function resetFields() {
        setActivityTitle("");
        setActivityDate("");
        setActivityHour("");
        setShowModal(MODAL.NONE);
    }

    async function handleCreateActivity() {
        try {
            if (!activityTitle || !activityHour || !activityDate) {
                return Alert.alert("Add Activity", "Fill all fields");
            }

            setIsCreatingActivity(true);

            await activitiesServer.create({
                tripId: tripDetails.id,
                occurs_at: dayjs(activityDate).add(Number(activityHour), "h").toString(),
                title: activityTitle
            });

            Alert.alert("Add Activity", "Activity added successfuly");
            await loadActivities();
            resetFields();

        } catch (error) {
            console.log(error);
        } finally {
            setIsCreatingActivity(false);
        }
    }

    async function loadActivities() {
        try {
            const activities = await activitiesServer.getActivitiesByTripId(tripDetails.id);
            const sectionList = activities.map(dayAct => ({
                title: {
                    dayNumber: dayjs(dayAct.date).date(),
                    dayName: dayjs(dayAct.date).format("dddd")
                },
                data: dayAct.activities.map(act => ({
                    id: act.id,
                    title: act.title,
                    hour: dayjs(act.occurs_at).format("hh:mm a"),
                    isBefore: dayjs(act.occurs_at).isBefore(dayjs())
                })).sort((d1, d2) => d1.hour > d2.hour ? 1 : -1)
            }));
            setActivities(sectionList);

        } catch (error) {
            console.log(error);
        } finally {
            setIsLoadingActivities(false);
        }
    }

    useEffect(() => { loadActivities() }, []);

    return (
        <View className="flex-1">
            <View className="w-full flex-row mt-5 mb-6 items-center">
                <Text className="text-zinc-50 text-2xl font-semibold flex-1">
                    Activities
                </Text>
                <Button className="w-1/2" onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
                    <PlusIcon color={colors.lime[950]} />
                    <Button.Title>New Activity</Button.Title>
                </Button>
            </View>

            {isLoadingActivities ? <Loading /> : (
                <SectionList
                    sections={activities}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <Activity data={item} />}
                    renderSectionHeader={({ section }) => (
                        <View className="w-full">
                            <Text className="text-zinc-50 text-xl font-semibold py-2">
                                Dia {section.title.dayNumber + " "}
                                <Text className="text-zinc-400 text-base font-regular capitalize">
                                    {section.title.dayName}
                                </Text>
                            </Text>
                            {section.data.length === 0 && (
                                <Text className="text-zinc-400 font-regular text-sm mb-8">
                                    No activities yet
                                </Text>
                            )}
                        </View>
                    )}
                    contentContainerClassName="gap-3 pb-28"
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Modal
                title="Add Activity"
                subtitle="All guest can see the activities"
                visible={showModal === MODAL.NEW_ACTIVITY}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="mt-4 mb-3">
                    <Input variant="secondary">
                        <Tag color={colors.zinc[400]} size={20} />
                        <Input.Field placeholder="What activity"
                            onChangeText={setActivityTitle}
                            value={activityTitle}
                        />
                    </Input>

                    <View className="w-full mt-2 flex-row gap-2">
                        <Input variant="secondary" className="flex-1">
                            <IconCalendar color={colors.zinc[400]} size={20} />
                            <Input.Field placeholder="What Day"
                                onChangeText={setActivityDate}
                                value={activityDate
                                    ? dayjs(activityDate).format("DD [de] MMM")
                                    : ""
                                }
                                onFocus={() => Keyboard.dismiss()}
                                showSoftInputOnFocus={false}
                                onPressIn={() => setShowModal(MODAL.CALENDAR)}
                            />
                        </Input>
                        <Input variant="secondary" className="flex-1">
                            <Clock color={colors.zinc[400]} size={20} />
                            <Input.Field placeholder="What time"
                                onChangeText={
                                    hour => setActivityHour(hour.replace(".", "")
                                        .replace(",", ""))
                                }
                                value={activityHour}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                        </Input>
                    </View>
                </View>
                <Button className="mt-3"
                    onPress={handleCreateActivity}
                    isLoading={isCreatingActivity}>
                    <Button.Title>Save Activity</Button.Title>
                </Button>
            </Modal>

            <Modal
                title="Date Selection"
                subtitle="Select the activity day"
                visible={showModal === MODAL.CALENDAR}
                onClose={() => setShowModal(MODAL.NEW_ACTIVITY)}
            >
                <View className="gap-4 mt-4">
                    <Calendar
                        minDate={tripDetails.starts_at}
                        maxDate={tripDetails.ends_at}
                        initialDate={tripDetails.starts_at}
                        onDayPress={(day) => setActivityDate(day.dateString)}
                        markedDates={{ [activityDate]: { selected: true } }}
                    />
                    <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
                        <Button.Title>Confirm</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    );
}