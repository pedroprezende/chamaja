import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { storage } from "@/lib/storage";
import * as ImagePicker from "expo-image-picker";
// Removed mock import

export default function EditarPrestador() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;

  // Real data
  const { data: categories = [], isLoading: loadingCats, error: catError } = trpc.categories.list.useQuery();
  const { data: dbProvider, isLoading: loadingProvider } = trpc.providers.getById.useQuery(id as string, { enabled: isEditing });

  useEffect(() => {
    if (catError) console.error("[EditarPrestador] Erro categorias:", catError);
    console.log("[EditarPrestador] Categorias carregadas:", categories.length);
  }, [categories, catError]);

  const createMutation = trpc.providers.create.useMutation({
    onSuccess: () => {
      utils.providers.all.invalidate();
      utils.providers.list.invalidate();
    }
  });
  const updateMutation = trpc.providers.update.useMutation({
    onSuccess: () => {
      utils.providers.all.invalidate();
      utils.providers.list.invalidate();
      if (id) {
        utils.providers.getById.invalidate(id as string);
      }
    }
  });
  const deleteMutation = trpc.providers.delete.useMutation({
    onSuccess: () => {
      utils.providers.all.invalidate();
      utils.providers.list.invalidate();
    }
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bragança Paulista");
  const [neighborhood, setNeighborhood] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [coverUri, setCoverUri] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  
  const [selectedSpecialties, setSelectedSpecialties] = useState<Record<string, boolean>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ── New subcategory state ──
  const [newSubName, setNewSubName] = useState("");
  const [isCreatingSub, setIsCreatingSub] = useState(false);

  const utils = trpc.useUtils();
  const createSubService = trpc.categories.subServices.create.useMutation({
    onSuccess: (newSub) => {
      utils.categories.subServices.list.invalidate({ categoryId });
      utils.categories.subServices.listAll.invalidate();
      setNewSubName("");
      setIsCreatingSub(false);
      // Auto-select the new one
      setSelectedSpecialties(prev => ({ ...prev, [newSub.id]: true }));
    }
  });

  // Fetch subcategories for the selected category
  const { data: dbSubcategories = [], isLoading: loadingSubs } = trpc.categories.subServices.list.useQuery(
    { categoryId },
    { enabled: !!categoryId }
  );

  // Fetch admin services for this category to use as specialties too
  const { data: dbServices = [] } = trpc.services.getByCategory.useQuery(
    { categoryId },
    { enabled: !!categoryId }
  );

  // Fetch all subcategories globally for restoration mapping
  const { data: allSubServices = [] } = trpc.categories.subServices.listAll.useQuery();

  // Merge both lists
  const mergedSubcategories = React.useMemo(() => {
    const list: any[] = [];
    
    // 1. Subcategorias do DB
    dbSubcategories.forEach((s: any) => {
      list.push({ ...s, type: 'subcategory' });
    });

    // 2. Serviços Administrativos (como especialidades)
    dbServices.forEach((s: any) => {
      if (!list.find(item => typeof item.name === "string" && typeof s.name === "string" && item.name.toLowerCase() === s.name.toLowerCase())) {
        list.push({
          id: s.id,
          name: s.name,
          categoryId: s.categoryId || "",
          type: 'service',
        });
      }
    });
    return list;
  }, [categoryId, dbSubcategories, dbServices]);

  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (dbProvider && !hasInitialized.current) {
      setName(dbProvider.name ? String(dbProvider.name) : "");
      setCategory(dbProvider.category ? String(dbProvider.category) : "");
      setCategoryId(dbProvider.categoryId ? String(dbProvider.categoryId) : "");
      setSubcategoryName(dbProvider.subcategoryName ? String(dbProvider.subcategoryName) : "");
      setSubcategoryId(dbProvider.subcategoryId ? String(dbProvider.subcategoryId) : "");
      setDescription(dbProvider.description ? String(dbProvider.description) : "");
      setAddress(dbProvider.address ? String(dbProvider.address) : "");
      setCity(dbProvider.city ? String(dbProvider.city) : "Bragança Paulista");
      setNeighborhood(dbProvider.neighborhood ? String(dbProvider.neighborhood) : "");
      setIsActive(!!dbProvider.isActive);
      setDestaque(!!dbProvider.destaque);
      setWhatsapp(dbProvider.whatsapp ? String(dbProvider.whatsapp) : (dbProvider.phone ? String(dbProvider.phone) : ""));
      setAvatarUri(dbProvider.avatarUri ? String(dbProvider.avatarUri) : "");
      setCoverUri(dbProvider.coverUri ? String(dbProvider.coverUri) : "");
      setFoundedYear(dbProvider.foundedYear ? String(dbProvider.foundedYear) : "");

      // Safe Gallery recovery
      let initialGallery: string[] = [];
      const rawGallery: any = dbProvider.gallery;
      if (Array.isArray(rawGallery)) {
        initialGallery = rawGallery.map(g => String(g));
      } else if (typeof rawGallery === "string") {
        try {
          const parsed = JSON.parse(rawGallery);
          if (Array.isArray(parsed)) {
            initialGallery = parsed.map(g => String(g));
          } else {
            initialGallery = [rawGallery];
          }
        } catch {
          if (rawGallery.startsWith("{") && rawGallery.endsWith("}")) {
            initialGallery = rawGallery.slice(1, -1).split(",").map((s: string) => s.trim()).filter(Boolean);
          } else {
            initialGallery = [rawGallery];
          }
        }
      }
      setGallery(initialGallery);

      // Safe Services / Specialties restoration
      let specNames: any[] = [];
      try {
        if (dbProvider.services) {
          const parsed = JSON.parse(dbProvider.services);
          specNames = Array.isArray(parsed) ? parsed : [parsed];
        } else if (dbProvider.subcategoryName) {
          specNames = String(dbProvider.subcategoryName).split(",").map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        if (dbProvider.subcategoryName) {
          specNames = String(dbProvider.subcategoryName).split(",").map(s => s.trim()).filter(Boolean);
        }
      }

      // Convert any objects {"name": "...", "price": ...} into strings
      const specNamesCleaned = specNames.map(item => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof item.name === "string") return item.name;
        return "";
      }).filter(Boolean);

      // Restaurar múltiplas especialidades no mapa de seleção
      const newSelected: Record<string, boolean> = {};
      
      // Também tentamos restaurar pelos IDs se estiverem salvos no subcategoryId
      if (dbProvider.subcategoryId && typeof dbProvider.subcategoryId === "string") {
        const ids = dbProvider.subcategoryId.split(",").map(id => id.trim()).filter(Boolean);
        ids.forEach(id => { newSelected[id] = true; });
      }

      specNamesCleaned.forEach(name => {
        if (typeof name === "string") {
          const found = allSubServices.find(m => typeof m.name === "string" && m.name.toLowerCase() === name.toLowerCase()) ||
                        dbServices.find(m => typeof m.name === "string" && m.name.toLowerCase() === name.toLowerCase());
          if (found) {
            newSelected[found.id] = true;
          }
        }
      });
      
      setSelectedSpecialties(newSelected);
      setSubcategoryName(specNamesCleaned.join(", "));
      hasInitialized.current = true;
    }
  }, [dbProvider, allSubServices, dbServices]);

  const handleSave = async () => {
    if (!name.trim() || !category) {
      if (Platform.OS === "web") window.alert("Erro: Nome e categoria são obrigatórios.");
      else Alert.alert("Erro", "Nome e categoria são obrigatórios.");
      return;
    }
    
    setSaving(true);
    let errorDetails = "";
    try {
      // 1. Upload Avatar
      let finalAvatar = avatarUri;
      if (avatarUri && !avatarUri.startsWith("http")) {
        try {
          const uploadedUrl = await storage.uploadImage(avatarUri);
          if (uploadedUrl) finalAvatar = uploadedUrl;
        } catch (err: any) {
          errorDetails += `Avatar: ${err.message || "Erro no upload"}\n`;
        }
      }

      // 2. Upload Capa
      let finalCover = coverUri;
      if (coverUri && !coverUri.startsWith("http")) {
        try {
          const uploadedUrl = await storage.uploadImage(coverUri);
          if (uploadedUrl) finalCover = uploadedUrl;
        } catch (err: any) {
          errorDetails += `Capa: ${err.message || "Erro no upload"}\n`;
        }
      }

      // 3. Upload Galeria
      const finalGallery = [];
      let galleryFailures = 0;
      
      for (const img of gallery) {
        if (img.startsWith("http")) {
          finalGallery.push(img);
        } else {
          try {
            const uploadedUrl = await storage.uploadImage(img);
            if (uploadedUrl) {
              finalGallery.push(uploadedUrl);
            }
          } catch (err: any) {
            galleryFailures++;
            errorDetails += `Galeria [${galleryFailures}]: ${err.message || "Erro no upload"}\n`;
          }
        }
      }

      const selectedIds = Object.keys(selectedSpecialties).filter(id => selectedSpecialties[id]);
      const selectedItems = mergedSubcategories.filter(s => selectedIds.includes(s.id));
      
      const selectedNames = selectedItems.map(s => s.name);
      
      // Encontrar primeiro serviço selecionado (se houver) para o vínculo oficial
      const primaryService = selectedItems.find(s => s.type === 'service');
      const primarySubcat = selectedItems.find(s => s.type === 'subcategory');

      const data = {
        name: name.trim(),
        category: category || null,
        categoryId: categoryId || null,
        subcategoryName: selectedNames.join(", ") || subcategoryName || null,
        subcategoryId: selectedIds.join(", ") || subcategoryId || null,
        serviceId: primaryService?.id || null,
        serviceName: primaryService?.name || null,
        description: description || null,
        address: address || null,
        city: city || null,
        neighborhood: neighborhood || null,
        isActive,
        destaque,
        whatsapp: whatsapp || null,
        phone: whatsapp || null,
        avatarUri: finalAvatar || null,
        coverUri: finalCover || null,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        gallery: finalGallery.length > 0 ? finalGallery : null,
        services: JSON.stringify(selectedNames.length > 0 ? selectedNames : (subcategoryName ? [subcategoryName] : [])),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }

      if (Platform.OS === "web") {
        let msg = "Prestador salvo com sucesso!";
        if (errorDetails) msg += `\n\nAVISO DE FOTOS:\n${errorDetails}`;
        window.alert(msg);
      } else {
        Alert.alert("Sucesso", "Prestador salvo com sucesso!" + (errorDetails ? "\n\nAlgumas fotos falharam." : ""));
      }
      
      router.back();
    } catch (e: any) {
      const msg = e.message || "Erro desconhecido";
      console.error("[EditarPrestador] Erro ao salvar:", e);
      if (Platform.OS === "web") window.alert("Erro ao salvar dados: " + msg);
      else Alert.alert("Erro ao salvar dados", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const perform = async () => {
      try {
        await deleteMutation.mutateAsync({ id: id as string });
        router.back();
      } catch (e: any) {
        console.error("[EditarPrestador] Erro ao excluir:", e);
        const msg = e.message || "Erro desconhecido";
        if (Platform.OS === "web") window.alert("Erro ao excluir: " + msg);
        else Alert.alert("Erro ao excluir", msg);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Remover este prestador? Esta ação não pode ser desfeita.")) perform();
    } else {
      Alert.alert("Remover prestador", "Esta ação não pode ser desfeita.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: perform },
      ]);
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, // Reduzido para maior estabilidade
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.6,
    });
    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const pickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.6, // Reduzido para maior estabilidade
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setGallery(prev => [...prev, ...uris]);
    }
  };

  if (loadingProvider) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={15}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? "Editar Prestador" : "Novo Prestador"}</Text>
        {isEditing && (
          <Pressable 
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]} 
            onPress={handleDelete}
            hitSlop={15}
          >
            <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Cover & Avatar Header Section */}
        <View style={styles.coverAvatarSection}>
          <Pressable style={styles.coverWrap} onPress={pickCover}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialIcons name="add-photo-alternate" size={32} color="#9CA3AF" />
                <Text style={styles.coverPlaceholderText}>Adicionar Foto de Capa</Text>
              </View>
            )}
            <View style={styles.coverEditBtn}>
              <MaterialIcons name="camera-alt" size={18} color="#FFF" />
            </View>
          </Pressable>

          <View style={styles.avatarWrapFloating}>
            <Image
              source={{ uri: avatarUri || "https://ui-avatars.com/api/?name=" + encodeURIComponent(name || "P") }}
              style={styles.avatarFloating}
            />
            <Pressable style={styles.avatarCameraBtn} onPress={pickAvatar}>
              <MaterialIcons name="camera-alt" size={14} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nome do prestador</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.fieldLabel}>Categoria Principal</Text>
          <Pressable 
            style={styles.selectField}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={[styles.selectText, !category && { color: "#9CA3AF" }]}>
              {category || "Selecionar categoria"}
            </Text>
            <MaterialIcons name={showCategoryPicker ? "expand-less" : "expand-more"} size={24} color="#6B7280" />
          </Pressable>

          {showCategoryPicker && (
            <View style={styles.pickerDropdown}>
              {loadingCats ? (
                <ActivityIndicator size="small" color="#25D366" style={{ padding: 20 }} />
              ) : categories.length === 0 ? (
                <Text style={{ padding: 20, color: "#9CA3AF", textAlign: "center" }}>Nenhuma categoria encontrada.</Text>
              ) : categories.map((c) => (
                <Pressable 
                  key={c.id} 
                  style={[styles.pickerOption, categoryId === c.id && styles.pickerOptionActive]}
                  onPress={() => {
                    setCategory(c.name);
                    setCategoryId(c.id);
                    setSubcategoryName(""); 
                    setSubcategoryId("");
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, categoryId === c.id && { color: "#25D366", fontWeight: "700" }]}>{c.name}</Text>
                  {categoryId === c.id && <MaterialIcons name="check" size={20} color="#25D366" />}
                </Pressable>
              ))}
            </View>
          )}

          {/* Especialidade Picker */}
          {categoryId && (
            <>
              <View style={{ height: 16 }} />
              <Text style={styles.fieldLabel}>Especialidade</Text>
              <Pressable 
                style={styles.selectField}
                onPress={() => setShowSubcategoryPicker(!showSubcategoryPicker)}
              >
                <Text style={[styles.selectText, !subcategoryName && Object.keys(selectedSpecialties).filter(k => selectedSpecialties[k]).length === 0 && { color: "#9CA3AF" }]}>
                  {Object.keys(selectedSpecialties).filter(k => selectedSpecialties[k]).length > 0 
                    ? `${Object.keys(selectedSpecialties).filter(k => selectedSpecialties[k]).length} selecionados`
                    : subcategoryName || "Selecionar especialidade"}
                </Text>
                <MaterialIcons name={showSubcategoryPicker ? "expand-less" : "expand-more"} size={24} color="#6B7280" />
              </Pressable>

              {showSubcategoryPicker && (
                <View style={styles.pickerDropdown}>
                  {/* Option to create new subcategory */}
                  <View style={styles.addSubBox}>
                    <TextInput
                      style={styles.addSubInput}
                      placeholder="Nova subcategoria..."
                      value={newSubName}
                      onChangeText={setNewSubName}
                      placeholderTextColor="#9CA3AF"
                    />
                    <Pressable
                      style={[styles.addSubBtn, (!newSubName.trim() || isCreatingSub) && { opacity: 0.5 }]}
                      disabled={!newSubName.trim() || isCreatingSub}
                      onPress={async () => {
                        setIsCreatingSub(true);
                        try {
                          await createSubService.mutateAsync({
                            categoryId,
                            name: newSubName.trim(),
                            icon: "build"
                          });
                        } catch (e) {
                          Alert.alert("Erro", "Não foi possível criar a subcategoria");
                        } finally {
                          setIsCreatingSub(false);
                        }
                      }}
                    >
                      {isCreatingSub ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <MaterialIcons name="add" size={20} color="#FFF" />
                      )}
                    </Pressable>
                  </View>

                  <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />

                  {loadingSubs ? (
                    <ActivityIndicator size="small" color="#25D366" style={{ padding: 20 }} />
                  ) : mergedSubcategories.length === 0 ? (
                    <Text style={{ padding: 20, color: "#9CA3AF", textAlign: "center" }}>Nenhuma subcategoria disponível.</Text>
                  ) : (
                    mergedSubcategories.map((s) => {
                      const isSelected = !!selectedSpecialties[s.id] || subcategoryId === s.id;
                      return (
                        <Pressable 
                          key={s.id} 
                          style={[styles.pickerOption, isSelected && styles.pickerOptionActive]}
                          onPress={() => {
                            setSelectedSpecialties(prev => ({
                              ...prev,
                              [s.id]: !isSelected
                            }));
                            // Se estiver desmarcando o principal antigo
                            if (subcategoryId === s.id && isSelected) {
                              setSubcategoryId("");
                              setSubcategoryName("");
                            }
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                            <MaterialIcons 
                              name={s.type === 'service' ? 'star-outline' : 'label-outline'} 
                              size={16} 
                              color={isSelected ? "#25D366" : "#9CA3AF"} 
                            />
                            <Text style={[styles.pickerOptionText, isSelected && { color: "#25D366", fontWeight: "700" }]}>{s.name}</Text>
                          </View>
                          {isSelected && <MaterialIcons name="check-circle" size={20} color="#25D366" />}
                        </Pressable>
                      );
                    })
                  )}
                </View>
              )}
            </>
          )}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Descrição</Text>
          <TextInput
            style={[styles.fieldInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Cidade</Text>
              <TextInput
                style={styles.fieldInput}
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Bairro</Text>
              <TextInput
                style={styles.fieldInput}
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Endereço Completo / Google Maps Link</Text>
          <TextInput
            style={styles.fieldInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Ex: Rua Central, 123 ou link do maps"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Ano início (Fundação)</Text>
          <TextInput
            style={styles.fieldInput}
            value={foundedYear}
            onChangeText={setFoundedYear}
            placeholder="Ex: 2020"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.switchRight}>
              <Text style={[styles.switchLabel, { color: isActive ? "#25D366" : "#9CA3AF" }]}>
                {isActive ? "Ativo" : "Inativo"}
              </Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={isActive ? "#25D366" : "#D1D5DB"}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Destaque para você</Text>
            <View style={styles.switchRight}>
              <Text style={[styles.switchLabel, { color: destaque ? "#25D366" : "#9CA3AF" }]}>
                {destaque ? "Sim" : "Não"}
              </Text>
              <Switch
                value={destaque}
                onValueChange={setDestaque}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={destaque ? "#25D366" : "#D1D5DB"}
              />
            </View>
          </View>
        </View>

        {/* Gallery */}
        <Text style={styles.sectionTitle}>Galeria de fotos (Local/Serviços)</Text>
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {gallery.map((uri, idx) => (
              <View key={idx} style={{ position: "relative" }}>
                <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                <Pressable
                  style={{ position: "absolute", top: -5, right: -5, backgroundColor: "#EF4444", borderRadius: 10 }}
                  onPress={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                >
                  <MaterialIcons name="close" size={16} color="#FFF" />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addGalleryBtn} onPress={pickGallery}>
              <MaterialIcons name="add-a-photo" size={24} color="#25D366" />
            </Pressable>
          </ScrollView>
        </View>

        {/* Contact */}
        <Text style={styles.sectionTitle}>Informações de contato</Text>
        <View style={styles.card}>
          <View style={styles.contactRow}>
            <View style={styles.waIcon}>
              <MaterialIcons name="chat" size={18} color="#25D366" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <TextInput
              style={styles.contactInput}
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
              placeholder="Ex: 11999999999"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>Salvar Prestador</Text>
            </>
          )}
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    zIndex: 10, elevation: 10,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  deleteBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
  },
  content: { padding: 16, gap: 0 },
  coverAvatarSection: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    width: "100%",
  },
  coverWrap: {
    width: "100%",
    height: 160,
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    alignItems: "center",
    gap: 4,
  },
  coverPlaceholderText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  coverEditBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapFloating: {
    position: "relative",
    marginTop: -45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarFloating: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#F3F4F6",
  },
  avatarCameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#F3F4F6", marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8, marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  fieldInput: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: "#111827", backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,
  textArea: { minHeight: 80, textAlignVertical: "top", paddingTop: 10 },
  selectField: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#F9FAFB",
  },
  selectText: { fontSize: 14, color: "#111827" },
  pickerDropdown: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, marginTop: 4,
    backgroundColor: "#FFFFFF", overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  pickerOptionActive: { backgroundColor: "#F0FDF4" },
  pickerOptionText: { fontSize: 14, color: "#374151" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  switchRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontSize: 13, fontWeight: "600" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  waIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  contactLabel: { fontSize: 13, fontWeight: "600", color: "#374151", width: 70 },
  contactInput: {
    flex: 1, fontSize: 14, color: "#111827",
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 15, gap: 8,
    marginTop: 8,
  },
  saveBtnSaved: { backgroundColor: "#16A34A" },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  addGalleryBtn: {
    width: 80, height: 80, borderRadius: 10, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center", borderStyle: "dashed",
    borderWidth: 1, borderColor: "#25D366",
  },
  addSubBox: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  addSubInput: {
    flex: 1,
    height: 38,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#111827",
  },
  addSubBtn: {
    width: 38,
    height: 38,
    backgroundColor: "#25D366",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
