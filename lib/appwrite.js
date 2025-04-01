import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.ttvaroh.aora",
  projectId: "67a18674001a1bddd682",
  storageId: "67a2a794003b15549feb",
  databaseId: "67a2a5f10036dd0d149e",
  userCollectionId: "67a2a60d0035ebcd79d6",
  videoCollectionId: "67a2a62d000d2f946972",
  pinsCollectionID: "67ebfd9d0004bfff94f5",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Register user
export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Map Service
export const mapService = {
  // Get current user
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  // Add a new pin
  async addPin(latitude, longitude, title, description) {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const pinData = {
        userId: user.$id,
        latitude,
        longitude,
        title: title || "New Pin",
        description: description || "",
        createdAt: new Date().toISOString(),
        approvals: [], // Empty array for approvals
        declines: [], // Empty array for declines
        status: "active", // Initial status
      };

      const result = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        "unique()",
        pinData
      );

      return result;
    } catch (error) {
      console.error("Error adding pin:", error);
      throw error;
    }
  },

  // Get all pins
  async getAllPins() {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        [
          Query.orderDesc("createdAt"),
          Query.limit(100), // Adjust limit as needed
        ]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching pins:", error);
      return [];
    }
  },

  // Approve a pin
  async approvePin(pinId) {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the current pin data
      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      // Prevent creator from approving their own pin
      if (pin.userId === user.$id) {
        throw new Error("Cannot approve your own pin");
      }

      // If user already approved, do nothing
      if (pin.approvals.includes(user.$id)) {
        return pin;
      }

      // Remove user from declines if they previously declined
      const updatedDeclines = pin.declines.filter((id) => id !== user.$id);

      // Add user to approvals
      const updatedApprovals = [...pin.approvals, user.$id];

      // Update the pin
      const result = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId,
        {
          approvals: updatedApprovals,
          declines: updatedDeclines,
        }
      );

      return result;
    } catch (error) {
      console.error("Error approving pin:", error);
      throw error;
    }
  },

  // Decline a pin
  async declinePin(pinId) {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the current pin data
      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      // Prevent creator from declining their own pin
      if (pin.userId === user.$id) {
        throw new Error("Cannot decline your own pin");
      }

      // If user already declined, do nothing
      if (pin.declines.includes(user.$id)) {
        return pin;
      }

      // Remove user from approvals if they previously approved
      const updatedApprovals = pin.approvals.filter((id) => id !== user.$id);

      // Add user to declines
      const updatedDeclines = [...pin.declines, user.$id];

      // Update pin status if needed
      let status = pin.status;
      if (
        updatedDeclines.length > updatedApprovals.length &&
        updatedDeclines.length >= 3
      ) {
        status = "disputed";
      }

      // Update the pin
      const result = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId,
        {
          approvals: updatedApprovals,
          declines: updatedDeclines,
          status,
        }
      );

      return result;
    } catch (error) {
      console.error("Error declining pin:", error);
      throw error;
    }
  },

  // Mark pin as resolved
  async markPinAsResolved(pinId) {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the current pin data
      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      // Check if user has permission to resolve
      const hasPermission =
        pin.userId === user.$id || // Creator can always resolve
        pin.approvals.length >= 2; // Or if 2+ users approved

      if (!hasPermission) {
        throw new Error("Insufficient permissions to resolve this pin");
      }

      // Update the pin status
      const result = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId,
        {
          status: "resolved",
        }
      );

      return result;
    } catch (error) {
      console.error("Error resolving pin:", error);
      throw error;
    }
  },

  // Delete a pin
  async deletePin(pinId) {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the current pin data
      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      // Check if user has permission to delete
      const hasPermission =
        pin.userId === user.$id || // Creator can always delete
        pin.approvals.length >= 2; // Or if 2+ users approved

      if (!hasPermission) {
        throw new Error("Insufficient permissions to delete this pin");
      }

      // Delete the pin
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      return true;
    } catch (error) {
      console.error("Error deleting pin:", error);
      throw error;
    }
  },

  // Update a pin (only creator can update)
  async updatePin(pinId, updatedData) {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the current pin data
      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      // Only creator can update pin details
      if (pin.userId !== user.$id) {
        throw new Error("Only the creator can update pin details");
      }

      const result = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId,
        updatedData
      );

      return result;
    } catch (error) {
      console.error("Error updating pin:", error);
      throw error;
    }
  },

  // Check if current user can edit a pin
  async canEditPin(pinId) {
    try {
      const user = await this.getCurrentUser();

      if (!user) return false;

      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      return pin.userId === user.$id;
    } catch (error) {
      return false;
    }
  },

  // Check if current user can delete a pin
  async canDeletePin(pinId) {
    try {
      const user = await this.getCurrentUser();

      if (!user) return false;

      const pin = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.pinsCollectionID,
        pinId
      );

      return pin.userId === user.$id || pin.approvals.length >= 2;
    } catch (error) {
      return false;
    }
  },
};
