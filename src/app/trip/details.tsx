import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { Participant, ParticipantProps } from "@/components/participant";
import { TripLink, TripLinkProps } from "@/components/tripLink";
import { linksServer } from "@/server/links-server";
import { participantsServer } from "@/server/participants-server";
import { colors } from "@/styles/colors";
import { validateInput } from "@/utils/validateInput";
import { Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

export function Details({ tripId }: { tripId: string }) {
    const [showModal, setShowModal] = useState(false);
    const [isCreatingLink, setIsCreatingLink] = useState(false);

    const [linkTitle, setLinkTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    const [links, setLinks] = useState<TripLinkProps[]>([]);
    const [participants, setParticipants] = useState<ParticipantProps[]>([]);

    function resetFields() {
        setLinkTitle("");
        setLinkUrl("");
        setShowModal(false);
    }

    async function handleCreateLink() {
        try {
            if (!linkTitle.trim()) {
                return Alert.alert("Link", "Give the link a title");
            }

            if (!validateInput.url(linkUrl.trim())) {
                return Alert.alert("Link", "Invalid Link");
            }

            setIsCreatingLink(true);
            await linksServer.create({
                tripId,
                title: linkTitle,
                url: linkUrl
            });

            Alert.alert("Link", "Link created successfuly");
            await getTripLinks();
            resetFields();

        } catch (error) {
            console.log(error);
        } finally {
            setIsCreatingLink(false);
        }
    }

    async function getTripParticipants() {
        try {
            setParticipants(await participantsServer.getByTripId(tripId));
        } catch (error) {
            console.log(error);
        }
    }

    async function getTripLinks() {
        try {
            setLinks(await linksServer.getLinksByTripId(tripId));
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => { getTripLinks(); getTripParticipants(); }, []);

    return (
        <View className="flex-1 mt-5">
            <Text className="text-zinc-50 text-2xl font-semibold mb-2">
                Important Links
            </Text>

            <View className="flex-1" style={{ flexGrow: .8 }}>
                {links.length > 0 ? (
                    <FlatList
                        data={links}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <TripLink data={item} />}
                        contentContainerClassName="gap-4"
                    />
                ) : (
                    <Text className="text-zinc-400 font-regular text-base mt-2 mb-6">
                        No Links created
                    </Text>
                )}

                <Button variant="secondary" onPress={() => setShowModal(true)}>
                    <Plus color={colors.zinc[200]} size={20} />
                    <Button.Title>Create new Link</Button.Title>
                </Button>
            </View>

            <View className="flex-1 flex-grow border-t  border-zinc-800 mt-6">
                <Text className="text-zinc-50 text-2xl font-semibold my-5">
                    Guests
                </Text>
                <FlatList
                    data={participants}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <Participant data={item} />}
                    contentContainerClassName="gap-4 pb-28"
                />
            </View>

            <Modal
                title="Create Link"
                subtitle="All guests can see important links"
                visible={showModal}
                onClose={() => setShowModal(false)}
            >
                <View className="gap-2 mb-3">
                    <Input variant="secondary">
                        <Input.Field placeholder="Link Title"
                            onChangeText={setLinkTitle} />
                    </Input>
                    <Input variant="secondary">
                        <Input.Field placeholder="Link URL"
                            onChangeText={setLinkUrl} />
                    </Input>
                </View>
                <Button className="mt-3" onPress={handleCreateLink}
                    isLoading={isCreatingLink}>
                    <Button.Title>Save Link</Button.Title>
                </Button>
            </Modal>
        </View>
    );
}