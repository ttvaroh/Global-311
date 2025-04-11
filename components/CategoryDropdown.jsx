import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";

const CategoryDropdown = ({
  categories,
  selectedCategory,
  onSelectCategory,
  placeholder = "Select a category",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(categories);

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchTerm, categories]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSearchTerm("");
    setFilteredCategories(categories);
  };

  const handleSelectCategory = (category) => {
    onSelectCategory(category);
    setIsOpen(false);
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        className="border border-white rounded p-2.5 flex-row justify-between items-center"
        onPress={toggleDropdown}
      >
        <Text className="text-white">
          {selectedCategory ? selectedCategory.name : placeholder}
        </Text>
        <Text className="text-white">{isOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View className="border border-white rounded mt-1 bg-gray-800 max-h-40">
          <TextInput
            className="border-b border-white p-2 text-white"
            placeholder="Search categories..."
            placeholderTextColor="gray"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-2.5 border-b border-gray-700"
                onPress={() => handleSelectCategory(item)}
              >
                <Text className="text-white">{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-white p-2.5 text-center">
                No categories found
              </Text>
            }
          />
        </View>
      )}
    </View>
  );
};

export default CategoryDropdown;
