package com.acekyle.bingo;

import android.content.Context;
import android.os.Environment;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class FileHelper {
    private static final String TAG = "FileHelper";
    private static final String PREFS_FILENAME = "PREFS.txt";
    private static final int MAX_FILES_TO_READ = 1;

    private final Context context;
    private File listDirectory;
    private File prefsFile;

    public FileHelper(Context context) {
        this.context = context;
        initializeDirectories();
    }

    private void initializeDirectories() {
        try {
            // Get application's external files directory
            File externalDir = context.getExternalFilesDir(null);
            if (externalDir == null) {
                Log.e(TAG, "External directory is null");
                return;
            }

            // Create list directory if it doesn't exist
            listDirectory = new File(externalDir, "list");
            if (!listDirectory.exists()) {
                boolean created = listDirectory.mkdirs();
                if (!created) {
                    Log.e(TAG, "Failed to create list directory");
                }
            }

            // Create or access PREFS.txt file
            prefsFile = new File(externalDir, PREFS_FILENAME);
            if (!prefsFile.exists()) {
                boolean created = prefsFile.createNewFile();
                if (created) {
                    // Initialize with "0" if file is newly created
                    try (FileWriter writer = new FileWriter(prefsFile)) {
                        writer.write("0");
                    }
                } else {
                    Log.e(TAG, "Failed to create PREFS file");
                }
            }
        } catch (IOException e) {
            Log.e(TAG, "Error initializing directories", e);
        }
    }

    public String getNumberData() {
        try {
            Log.d(TAG, "getNumberData is called");
            // Get current preference (last used file number)
            int lastUsedFileNumber = getCurrentPreference();

            // Get list of number files
            List<File> numberFiles = getNumberFiles(lastUsedFileNumber);

            // If no files found, return empty array
            if (numberFiles.isEmpty()) {
                return "[]";
            }

            // Process files and update preference with the latest file number
            JSONArray dataArray = processNumberFiles(numberFiles);
            updatePreference(getHighestFileNumber(numberFiles));

            Log.d(TAG, "LOAD Number data: " + dataArray.toString());

            return dataArray.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error getting number data", e);
            return "[]";
        }
    }

    private int getCurrentPreference() {
        try (BufferedReader reader = new BufferedReader(new FileReader(prefsFile))) {
            String line = reader.readLine();
            if (line != null && !line.isEmpty()) {
                return Integer.parseInt(line.trim());
            }
        } catch (IOException | NumberFormatException e) {
            Log.e(TAG, "Error reading preference file", e);
        }
        return 0;
    }

    private void updatePreference(int fileNumber) {
        try (FileWriter writer = new FileWriter(prefsFile)) {
            writer.write(String.valueOf(fileNumber));
        } catch (IOException e) {
            Log.e(TAG, "Error updating preference file", e);
        }
    }

    private List<File> getNumberFiles(int lastUsedFileNumber) {
        if (!listDirectory.exists() || !listDirectory.isDirectory()) {
            Log.e(TAG, "List directory does not exist or is not a directory");
            return Collections.emptyList();
        }

        File[] files = listDirectory.listFiles((dir, name) -> {
            if (!name.endsWith(".txt")) {
                return false;
            }
            try {
                int fileNumber = Integer.parseInt(name.substring(0, name.length() - 4));
                return fileNumber > lastUsedFileNumber;
            } catch (NumberFormatException e) {
                return false;
            }
        });

        if (files == null || files.length == 0) {
            return Collections.emptyList();
        }

        // Sort files by their numeric name
        List<File> fileList = Arrays.asList(files);
        Collections.sort(fileList, Comparator.comparingInt(file -> {
            String fileName = file.getName();
            return Integer.parseInt(fileName.substring(0, fileName.length() - 4));
        }));

        // Limit to MAX_FILES_TO_READ
        return fileList.subList(0, Math.min(fileList.size(), MAX_FILES_TO_READ));
    }

    private JSONArray processNumberFiles(List<File> files) {
        JSONArray dataArray = new JSONArray();

        for (File file : files) {
            try {
                String fileName = file.getName();
                JSONObject fileData = new JSONObject();
                fileData.put("filename", fileName);

                JSONArray numbersArray = new JSONArray();
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty()) {
                            try {
                                int number = Integer.parseInt(line);
                                numbersArray.put(number);
                            } catch (NumberFormatException e) {
                                Log.w(TAG, "Invalid number in file " + fileName + ": " + line);
                            }
                        }
                    }
                }

                fileData.put("numbers", numbersArray);
                dataArray.put(fileData);
            } catch (IOException | JSONException e) {
                Log.e(TAG, "Error processing file " + file.getName(), e);
            }
        }

        return dataArray;
    }

    private int getHighestFileNumber(List<File> files) {
        if (files.isEmpty()) {
            return 0;
        }

        // Get the last file (highest number) since the list is sorted
        File lastFile = files.get(files.size() - 1);
        String fileName = lastFile.getName();
        try {
            return Integer.parseInt(fileName.substring(0, fileName.length() - 4));
        } catch (NumberFormatException e) {
            Log.e(TAG, "Error parsing file number from " + fileName, e);
            return 0;
        }
    }
}