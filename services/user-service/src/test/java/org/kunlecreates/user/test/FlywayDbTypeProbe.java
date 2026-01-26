package org.kunlecreates.user.test;

import javax.sql.DataSource;

public final class FlywayDbTypeProbe {

    public static String detect(DataSource ds) {
        try {
            String name = ds.getConnection().getMetaData().getDatabaseProductName();
            return name == null ? "" : name.toLowerCase();
        } catch (Exception e) {
            return "";
        }
    }
}
